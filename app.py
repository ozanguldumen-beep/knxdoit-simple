from io import BytesIO
from flask import Flask, render_template, request, jsonify, send_file
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)

DPT_RULES = {
    "lamp": [
        {"name": "Aç/Kapa", "dpt": "DPST-1-1"},
        {"name": "Geri Bildirim", "dpt": "DPST-1-1"},
    ],
    "dimmer": [
        {"name": "On/Off", "dpt": "DPST-1-1"},
        {"name": "Dimleme", "dpt": "DPST-3-7"},
        {"name": "Parlaklık", "dpt": "DPST-5-1"},
        {"name": "Parlaklık FB", "dpt": "DPST-5-1"},
    ],
    "blind": [
        {"name": "Yukarı/Aşağı", "dpt": "DPST-1-8"},
        {"name": "Step/Stop", "dpt": "DPST-1-7"},
        {"name": "Pozisyon", "dpt": "DPST-5-1"},
        {"name": "Pozisyon FB", "dpt": "DPST-5-1"},
    ],
    "valve": [
        {"name": "Vana Aç/Kapa", "dpt": "DPST-1-1"},
        {"name": "Vana FB", "dpt": "DPST-1-1"},
    ],
    "thermostat": [
        {"name": "Sıcaklık", "dpt": "DPST-9-1"},
        {"name": "Set Değeri", "dpt": "DPST-9-1"},
        {"name": "Mod", "dpt": "DPST-20-102"},
    ],
    "switch": [
        {"name": "Buton 1", "dpt": "DPST-1-1"},
        {"name": "Buton 2", "dpt": "DPST-1-1"},
    ],
    "sensor": [
        {"name": "Hareket", "dpt": "DPST-1-1"},
        {"name": "Işık Seviyesi", "dpt": "DPST-9-4"},
    ],
    "thermo_switch": [
        {"name": "Sıcaklık", "dpt": "DPST-9-1"},
        {"name": "Set Değeri", "dpt": "DPST-9-1"},
        {"name": "Buton 1", "dpt": "DPST-1-1"},
        {"name": "Buton 2", "dpt": "DPST-1-1"},
    ],
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/group-addresses", methods=["POST"])
def group_addresses():
    data = request.get_json(force=True) or {}
    rooms = data.get("rooms", [])
    result = []
    sub_counter = 1

    for room_index, room in enumerate(rooms, start=1):
        room_name = room.get("name", f"Oda {room_index}")
        for device in room.get("devices", []):
            dtype = device.get("type")
            dname = device.get("name", dtype)
            for rule in DPT_RULES.get(dtype, []):
                result.append({
                    "address": f"1/{room_index}/{sub_counter}",
                    "room": room_name,
                    "device": dname,
                    "function": rule["name"],
                    "dpt": rule["dpt"]
                })
                sub_counter += 1

    return jsonify(result)

@app.route("/api/pdf", methods=["POST"])
def pdf():
    data = request.get_json(force=True) or {}
    wires = data.get("wires", [])
    rooms = data.get("rooms", [])
    panels = data.get("panels", [])

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=22, leftMargin=22, topMargin=22, bottomMargin=22)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("KNXdoit - Elektrikçi Kablo Bağlantı Çıktısı", styles["Title"]))
    story.append(Paragraph("Kahverengi: 220V enerji hattı  |  Yeşil: KNX Bus hattı", styles["Normal"]))
    story.append(Spacer(1, 12))

    summary = [
        ["Toplam Oda", len(rooms)],
        ["Toplam Pano", len(panels)],
        ["Toplam Bağlantı", len(wires)],
    ]
    t = Table(summary, colWidths=[140, 80])
    t.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("BACKGROUND", (0,0), (0,-1), colors.lightgrey),
    ]))
    story.append(t)
    story.append(Spacer(1, 18))

    rows = [["No", "Hat Tipi", "Başlangıç", "Bitiş", "Not"]]
    for i, w in enumerate(wires, start=1):
        line_type = "Enerji 220V" if w.get("type") == "energy" else "KNX Bus"
        note = "Kahverengi kablo" if w.get("type") == "energy" else "Yeşil KNX kablo"
        rows.append([
            i,
            line_type,
            w.get("fromLabel", "-"),
            w.get("toLabel", "-"),
            note
        ])

    table = Table(rows, colWidths=[35, 95, 240, 240, 130])
    table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.4, colors.grey),
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#102033")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
    ]))
    story.append(Paragraph("Bağlantı Listesi", styles["Heading2"]))
    story.append(table)

    story.append(Spacer(1, 18))
    story.append(Paragraph("Not: Bu çıktı saha elektrikçisi için kablo yönlendirme ve bağlantı kontrol listesi olarak hazırlanmıştır.", styles["Normal"]))

    doc.build(story)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="knxdoit_kablo_baglanti.pdf", mimetype="application/pdf")

if __name__ == "__main__":
    app.run(debug=True)
