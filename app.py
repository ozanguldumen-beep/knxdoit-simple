from io import BytesIO
from flask import Flask, render_template, request, jsonify, send_file
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

app = Flask(__name__)

FONT_NAME = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
try:
    fp = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    bp = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    if os.path.exists(fp):
        pdfmetrics.registerFont(TTFont("DejaVuSans", fp))
        FONT_NAME = "DejaVuSans"
    if os.path.exists(bp):
        pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", bp))
        FONT_BOLD = "DejaVuSans-Bold"
except Exception:
    pass

DPT_RULES = {
    "knx_switch": [("Buton", "DPST-1-1")],
    "knx_thermostat": [("Sıcaklık", "DPST-9-1"), ("Set Değeri", "DPST-9-1")],
    "knx_sensor": [("Hareket", "DPST-1-1"), ("Işık", "DPST-9-4")],
    "knx_thermo_switch": [("Sıcaklık", "DPST-9-1"), ("Buton", "DPST-1-1")],
    "binary_input": [("Giriş", "DPST-1-1")],
    "aircon_gateway": [("Klima On/Off", "DPST-1-1"), ("Mod", "DPST-20-105"), ("Setpoint", "DPST-9-1"), ("Fan", "DPST-5-1")],
    "lamp": [("Aç/Kapa", "DPST-1-1"), ("Geri Bildirim", "DPST-1-1")],
    "dim_lamp": [("On/Off", "DPST-1-1"), ("Parlaklık", "DPST-5-1")],
    "blind": [("Up/Down", "DPST-1-8"), ("Stop", "DPST-1-7")],
    "valve": [("Aç/Kapa", "DPST-1-1")],
    "motor_valve": [("Motorlu Vana", "DPST-1-1")],
    "onoff": [("On/Off", "DPST-1-1")],
    "aircon_onoff": [("Klima On/Off", "DPST-1-1")],
    "boiler": [("Kombi On/Off", "DPST-1-1")],
    "door": [("Kapı Kontrol", "DPST-1-1")],
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/group-addresses", methods=["POST"])
def group_addresses():
    data = request.get_json(force=True) or {}
    result = []
    sub = 1
    phys = 1
    for floor_index, floor in enumerate(data.get("floors", []), start=1):
        for room_index, room in enumerate(floor.get("rooms", []), start=1):
            for dev in room.get("devices", []):
                physical = f"1.{floor_index}.{phys}"
                phys += 1
                for fname, dpt in DPT_RULES.get(dev.get("type"), []):
                    result.append({
                        "physical": physical,
                        "address": f"{floor_index}/{room_index}/{sub}",
                        "floor": floor.get("name", f"Kat {floor_index}"),
                        "room": room.get("name", "Oda"),
                        "device": dev.get("name", dev.get("type")),
                        "function": fname,
                        "dpt": dpt
                    })
                    sub += 1
    return jsonify(result)

def draw_device(c, x, y, label, icon=""):
    c.setStrokeColor(colors.black)
    c.setFillColor(colors.white)
    c.roundRect(x-24, y-18, 48, 36, 5, stroke=1, fill=1)
    c.setFillColor(colors.black)
    c.setFont(FONT_BOLD, 6)
    c.drawCentredString(x, y-28, label[:18])
    c.setFont(FONT_NAME, 10)
    c.drawCentredString(x, y-4, icon or "KNX")

def draw_pdf_schematic(c, data, y_start):
    width, height = landscape(A4)
    c.setFont(FONT_BOLD, 14)
    c.drawString(30, y_start, "1. KNX Bus Şeması")
    y = y_start - 35
    bus_left = 85
    bus_right = width - 80

    rows = []
    panels = data.get("panels", [])
    if panels:
        pdev = []
        for p in panels:
            for d in p.get("devices", []):
                pdev.append((p.get("name","Pano"), d.get("name","Modül"), d.get("type","")))
        rows.append(("Pano / Ana Hat", pdev))

    for f in data.get("floors", []):
        devices = []
        for r in f.get("rooms", []):
            for d in r.get("devices", []):
                typ = d.get("type", "")
                if d.get("kind") in ["knx", "actuator"] or typ in ["aircon_gateway", "binary_input"]:
                    devices.append((r.get("name","Oda"), d.get("name","Cihaz"), typ))
        rows.append((f.get("name","Kat"), devices))

    for idx, (row_name, devs) in enumerate(rows[:4]):
        row_y = y - idx * 88
        c.setStrokeColor(colors.HexColor("#0f9d58"))
        c.setLineWidth(3)
        c.line(bus_left, row_y, bus_right, row_y)
        c.setFillColor(colors.HexColor("#0f9d58"))
        c.setFont(FONT_BOLD, 8)
        c.drawString(35, row_y-3, row_name)
        c.drawString(bus_left, row_y+8, "KNX BUS")
        shown = devs[:8] or [(row_name, "Boş hat", "")]
        step = (bus_right - bus_left) / (len(shown)+1)
        for i, (_, name, typ) in enumerate(shown, start=1):
            x = bus_left + step*i
            c.setStrokeColor(colors.HexColor("#0f9d58"))
            c.line(x, row_y, x, row_y+38)
            icon = "A" if "actuator" in typ else "T" if "thermostat" in typ else "S" if "sensor" in typ else "K"
            draw_device(c, x, row_y+55, name, icon)
    return y - min(len(rows),4)*88 - 10

@app.route("/api/pdf", methods=["POST"])
def pdf():
    data = request.get_json(force=True) or {}
    wires = data.get("wires", [])
    validations = data.get("validation", [])
    project_name = data.get("projectName", "KNXdoit Projesi")

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    c.setFont(FONT_BOLD, 18)
    c.drawString(30, height-38, f"{project_name} - Elektrikçi Kablo ve KNX Topoloji Raporu")
    c.setFont(FONT_NAME, 9)
    c.drawString(30, height-58, "Kahverengi: 220V enerji hattı | Yeşil: KNX Bus hattı | Perde/Panjur: UP ve DOWN iki ayrı röle kanalıdır.")
    c.drawString(30, height-73, "Not: KNX Bus ana hat olarak düşünülür; cihazlar bu hatta T bağlantı ile bağlanır.")

    next_y = draw_pdf_schematic(c, data, height-105)

    c.setFont(FONT_BOLD, 14)
    c.setFillColor(colors.black)
    c.drawString(30, max(next_y, 190), "2. Proje Doğrulama")
    y = max(next_y, 190) - 18
    c.setFont(FONT_NAME, 7.5)
    if validations:
        for v in validations[:10]:
            c.setFillColor(colors.red if v.get("level") == "error" else colors.HexColor("#b45309"))
            c.drawString(35, y, f"- {v.get('message','')}"[:120])
            y -= 10
    else:
        c.setFillColor(colors.HexColor("#0f9d58"))
        c.drawString(35, y, "Proje temel doğrulama kurallarına uygun görünüyor.")
        y -= 12

    y -= 6
    c.setFillColor(colors.black)
    c.setFont(FONT_BOLD, 14)
    c.drawString(30, y, "3. Kablo Bağlantı Listesi")
    y -= 18

    c.setFont(FONT_BOLD, 7)
    headers = ["No", "Hat", "Başlangıç", "Bitiş", "Etiket", "Not"]
    xs = [30, 55, 125, 300, 475, 570]
    for x, h in zip(xs, headers):
        c.drawString(x, y, h)
    y -= 10
    c.setFont(FONT_NAME, 6.5)

    for i, w in enumerate(wires[:35], start=1):
        if y < 28:
            c.showPage()
            y = height-40
            c.setFont(FONT_NAME, 6.5)
        values = [
            str(i),
            "Enerji 220V" if w.get("type") == "energy" else "KNX Bus",
            w.get("fromLabel","-")[:32],
            w.get("toLabel","-")[:32],
            w.get("label","-")[:20],
            "DOWN otomatik" if w.get("autoDown") else ("T bağlantı" if w.get("type")=="knx" else "Röle bağlantısı")
        ]
        c.setFillColor(colors.black)
        for x, val in zip(xs, values):
            c.drawString(x, y, val)
        y -= 10

    c.setFont(FONT_NAME, 8)
    c.drawString(30, 16, "Bu rapor saha elektrikçisi için hazırlanmıştır. KNX programlama/grup adresleri ayrıca kontrol edilmelidir.")
    c.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="knxdoit_v10_releli_rapor.pdf", mimetype="application/pdf")

if __name__ == "__main__":
    app.run(debug=True)
