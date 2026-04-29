from io import BytesIO
from flask import Flask, render_template, request, jsonify, send_file
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)

DPT_RULES = {
    "knx_switch": [{"name": "Buton 1", "dpt": "DPST-1-1"}, {"name": "Buton 2", "dpt": "DPST-1-1"}],
    "knx_thermostat": [{"name": "Sıcaklık", "dpt": "DPST-9-1"}, {"name": "Set Değeri", "dpt": "DPST-9-1"}],
    "knx_sensor": [{"name": "Hareket", "dpt": "DPST-1-1"}, {"name": "Işık", "dpt": "DPST-9-4"}],
    "knx_thermo_switch": [{"name": "Sıcaklık", "dpt": "DPST-9-1"}, {"name": "Buton", "dpt": "DPST-1-1"}],
    "lamp": [{"name": "Aç/Kapa", "dpt": "DPST-1-1"}, {"name": "Geri Bildirim", "dpt": "DPST-1-1"}],
    "dim_lamp": [{"name": "On/Off", "dpt": "DPST-1-1"}, {"name": "Parlaklık", "dpt": "DPST-5-1"}],
    "blind": [{"name": "Up/Down", "dpt": "DPST-1-8"}, {"name": "Stop", "dpt": "DPST-1-7"}],
    "valve": [{"name": "Aç/Kapa", "dpt": "DPST-1-1"}],
    "motor_valve": [{"name": "Motorlu Vana", "dpt": "DPST-1-1"}],
    "onoff": [{"name": "On/Off", "dpt": "DPST-1-1"}],
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/group-addresses", methods=["POST"])
def group_addresses():
    data = request.get_json(force=True) or {}
    floors = data.get("floors", [])
    result = []
    sub = 1
    phys = 1
    for floor_index, floor in enumerate(floors, start=1):
        for room_index, room in enumerate(floor.get("rooms", []), start=1):
            for dev in room.get("devices", []):
                dtype = dev.get("type")
                physical = f"1.{floor_index}.{phys}"
                phys += 1
                for rule in DPT_RULES.get(dtype, []):
                    result.append({
                        "physical": physical,
                        "address": f"{floor_index}/{room_index}/{sub}",
                        "floor": floor.get("name", f"Kat {floor_index}"),
                        "room": room.get("name", "Oda"),
                        "device": dev.get("name", dtype),
                        "function": rule["name"],
                        "dpt": rule["dpt"]
                    })
                    sub += 1
    return jsonify(result)

@app.route("/api/pdf", methods=["POST"])
def pdf():
    data = request.get_json(force=True) or {}
    wires = data.get("wires", [])
    project_name = data.get("projectName", "KNXdoit Projesi")

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"{project_name} - Elektrikçi Kablo Bağlantı Raporu", styles["Title"]))
    story.append(Paragraph("Kahverengi: 220V enerji hattı | Yeşil: KNX Bus hattı | Perde/Panjur: UP ve DOWN iki ayrı röle kanalıdır.", styles["Normal"]))
    story.append(Spacer(1, 14))

    rows = [["No", "Hat", "Başlangıç", "Bitiş", "Etiket", "Not"]]
    for i, w in enumerate(wires, start=1):
        rows.append([
            i,
            "Enerji 220V" if w.get("type") == "energy" else "KNX Bus",
            w.get("fromLabel", "-"),
            w.get("toLabel", "-"),
            w.get("label", "-"),
            "DOWN otomatik" if w.get("autoDown") else ("T bağlantı" if w.get("type") == "knx" else "Röle bağlantısı")
        ])

    table = Table(rows, colWidths=[35, 85, 190, 190, 120, 130])
    table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.35, colors.grey),
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#102033")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    story.append(table)
    story.append(Spacer(1, 14))
    story.append(Paragraph("Not: KNX Bus yeşil ana hat olarak düşünülmeli, cihazlar bu hatta T bağlantı ile bağlanmalıdır.", styles["Normal"]))
    doc.build(story)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="knxdoit_v5_pro_kablo_raporu.pdf", mimetype="application/pdf")

if __name__ == "__main__":
    app.run(debug=True)
