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
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=22,
        leftMargin=22,
        topMargin=22,
        bottomMargin=22
    )
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("KNXdoit v4 - Elektrikçi Kablo Bağlantı ve KNX Topoloji Raporu", styles["Title"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Bu rapor saha elektrikçisi için hazırlanmıştır. Kahverengi hat 220V enerji, yeşil hat KNX Bus hattıdır. KNX Bus ana hat üzerinden T bağlantı mantığıyla gösterilir.",
        styles["Normal"]
    ))
    story.append(Paragraph(
        "Uyarı: KNX cihazlar enerji rölesine bağlanmaz. Enerji cihazlar KNX bus hattına bağlanmaz. Perde/Panjur için iki röle kanalı kullanılır: UP ve DOWN.",
        styles["Normal"]
    ))
    story.append(Spacer(1, 14))

    summary = [
        ["Toplam Oda", len(rooms), "Toplam Pano", len(panels), "Toplam Bağlantı", len(wires)],
    ]
    t = Table(summary, colWidths=[90, 55, 90, 55, 100, 55])
    t.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#eef2ff")),
        ("FONTNAME", (0,0), (-1,-1), "Helvetica-Bold"),
    ]))
    story.append(t)
    story.append(Spacer(1, 18))

    rows = [["No", "Hat", "Başlangıç", "Bitiş", "Etiket", "Elektrikçi Notu"]]
    for i, w in enumerate(wires, start=1):
        line_type = "Enerji 220V" if w.get("type") == "energy" else "KNX Bus"
        note = "Kahverengi kablo" if w.get("type") == "energy" else "Yeşil KNX kablo"
        if w.get("autoDown"):
            note += " - Perde/Panjur DOWN otomatik"
        rows.append([
            i,
            line_type,
            w.get("fromLabel", "-"),
            w.get("toLabel", "-"),
            w.get("label", "-"),
            note
        ])

    table = Table(rows, colWidths=[32, 72, 175, 175, 120, 160])
    table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.35, colors.grey),
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#102033")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("FONTSIZE", (0,0), (-1,-1), 7.8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(Paragraph("1. Kablo Bağlantı Listesi", styles["Heading2"]))
    story.append(table)

    story.append(Spacer(1, 18))

    channel_rows = [["Pano", "Modül", "Kanal", "Bağlı Cihaz", "Durum"]]
    for panel in panels:
        for module in panel.get("modules", []):
            for ch in module.get("channels", []):
                channel_rows.append([
                    panel.get("name", "Pano"),
                    module.get("name", ""),
                    ch.get("label", ""),
                    ch.get("usedBy") or "Boş",
                    "Kilitli" if ch.get("locked") else ("Dolu" if ch.get("usedBy") else "Boş")
                ])

    if len(channel_rows) > 1:
        ch_table = Table(channel_rows, colWidths=[120, 140, 60, 250, 80])
        ch_table.setStyle(TableStyle([
            ("GRID", (0,0), (-1,-1), 0.35, colors.grey),
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0f9d58")),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,-1), 8),
        ]))
        story.append(Paragraph("2. Pano Kanal Listesi", styles["Heading2"]))
        story.append(ch_table)

    story.append(Spacer(1, 18))
    story.append(Paragraph("3. Saha Notları", styles["Heading2"]))
    story.append(Paragraph("- Faz: Kahverengi / Siyah / Gri; Nötr: Mavi; Toprak: Sarı-Yeşil.", styles["Normal"]))
    story.append(Paragraph("- KNX Bus kablosu yeşil KNX kablosu olarak gösterilmiştir.", styles["Normal"]))
    story.append(Paragraph("- Perde/Panjur motorları için UP ve DOWN ayrı röle kanalıdır.", styles["Normal"]))
    story.append(Paragraph("- Aynı enerji cihazına ikinci röle bağlantısı yapılmamalıdır.", styles["Normal"]))

    doc.build(story)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="knxdoit_v4_kablo_topoloji_raporu.pdf", mimetype="application/pdf")

if __name__ == "__main__":
    app.run(debug=True)
