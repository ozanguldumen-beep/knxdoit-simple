import io
import json
import uuid
import zipfile
from datetime import datetime

DPT = {
    "light_load": [("SW", "DPST-1-1", "Aç/Kapa"), ("SW_FB", "DPST-1-1", "Aç/Kapa F.B")],
    "dim_light": [("DIM_SW", "DPST-1-1", "On/Off"), ("DIM_REL", "DPST-3-7", "Dimming"), ("DIM_VAL", "DPST-5-1", "Value"), ("DIM_FB", "DPST-5-1", "Value F.B")],
    "curtain_motor": [("BLD_MOVE", "DPST-1-8", "Up/Down"), ("BLD_STOP", "DPST-1-8", "Step/Stop"), ("BLD_POS", "DPST-5-1", "Pozisyon"), ("BLD_FB", "DPST-5-1", "Pozisyon F.B")],
    "push": [("PUSH", "DPST-1-1", "Buton"), ("PUSH_FB", "DPST-1-1", "Buton F.B")],
    "thermostat": [("TEMP_SET", "DPST-9-1", "Setpoint"), ("TEMP_ACT", "DPST-9-1", "Aktüel"), ("TEMP_MODE", "DPST-20-102", "Mod"), ("TEMP_FB", "DPST-9-1", "F.B")],
    "input": [("IN", "DPST-1-1", "Input")],
}


def addr_int(main, middle, sub):
    return (main << 11) | (middle << 8) | sub


def addr_str(value):
    return f"{(value >> 11) & 0x1F}/{(value >> 8) & 0x07}/{value & 0xFF}"


def build_gas(data):
    gas = []
    counter = 1
    main = 1
    middle = 1
    sub = 1

    connections = data.get("connections", [])
    for conn in connections:
        target_type = conn.get("targetType", "light_load")
        dpts = DPT.get(target_type, DPT.get("light_load"))
        for code, dpt, suffix in dpts:
            address = addr_int(main, middle, sub)
            gas.append({
                "id": f"GA-{counter}",
                "address": address,
                "address_str": addr_str(address),
                "name": f"{conn.get('targetName', 'Yük')} {suffix}",
                "dpt": dpt,
                "source": conn.get("sourceName", "Aktüatör"),
                "channel": conn.get("channel", 1),
                "target": conn.get("targetName", "Yük"),
                "targetType": target_type,
            })
            counter += 1
            sub += 1
            if sub > 250:
                sub = 1
                middle += 1
    return gas


def make_knxproj(project_name, data, ets_version="ETS6"):
    ns = "http://knx.org/xml/project/21" if ets_version == "ETS6" else "http://knx.org/xml/project/20"
    pid = "P-" + uuid.uuid4().hex[:6].upper()
    iid = pid + "-0"
    gas = build_gas(data)

    ga_xml = "".join(
        f'        <GroupAddress Id="{iid}_{g["id"]}" Address="{g["address"]}" Name="{g["name"]}" DatapointType="{g["dpt"]}" Puid="{i+1}" />\n'
        for i, g in enumerate(gas)
    )

    project_xml = f'''<?xml version="1.0" encoding="utf-8"?>
<KNX xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" CreatedBy="KNXdoit" ToolVersion="1.0" xmlns="{ns}">
  <Project Id="{pid}">
    <Installations>
      <Installation Name="{project_name}" BCUKey="4294967295">
        <Topology>
          <Area Id="{iid}_A-1" Address="1" Name="Alan 1" Puid="1">
            <Line Id="{iid}_L-1" Address="1" Name="Hat 1" MediumTypeRefId="MT-0" Puid="2" />
          </Area>
        </Topology>
        <GroupAddresses>
          <GroupRanges>
            <GroupRange Id="{iid}_GR-1" RangeStart="1" RangeEnd="65535" Name="{project_name}" Puid="3">
{ga_xml}            </GroupRange>
          </GroupRanges>
        </GroupAddresses>
      </Installation>
    </Installations>
  </Project>
</KNX>'''

    meta_xml = f'''<?xml version="1.0" encoding="utf-8"?>
<KNX xmlns="{ns}" CreatedBy="KNXdoit" ToolVersion="1.0">
  <Project Id="{pid}" Name="{project_name}" LastModified="{datetime.now().isoformat()}" GroupAddressStyle="ThreeLevel" />
</KNX>'''

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(f"{pid}/0.xml", project_xml)
        z.writestr(f"{pid}/project.xml", meta_xml)
        z.writestr(f"{pid}/knxdoit-data.json", json.dumps(data, ensure_ascii=False, indent=2))
    buf.seek(0)
    return buf, gas


def make_pdf(project_name, data):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    gas = build_gas(data)
    devices = data.get("devices", [])
    connections = data.get("connections", [])

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), topMargin=28, bottomMargin=28, leftMargin=28, rightMargin=28)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("KNXdoit — Elektrikçi Pano ve Bağlantı Raporu", styles["Title"]),
        Paragraph(f"Proje: {project_name}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph("Ürün Listesi", styles["Heading2"]),
    ]

    rows = [["Ürün", "Tip", "DIN", "Kanal"]]
    for d in devices:
        rows.append([d.get("name", "Cihaz"), d.get("type", "-"), str(d.get("moduleWidth", d.get("din_width", "-"))), str(d.get("channels", 1))])
    t = Table(rows, colWidths=[210, 100, 45, 45])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#185FA5")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), .4, colors.grey),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("PADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))
    story.append(Paragraph("Bağlantı Listesi", styles["Heading2"]))

    rows = [["Aktüatör", "Kanal", "Saha Yükü", "Tip"]]
    for c in connections:
        rows.append([c.get("sourceName", "Aktüatör"), f"K{c.get('channel', '-')}", c.get("targetName", "Yük"), c.get("targetType", "-")])
    t = Table(rows, colWidths=[220, 45, 180, 90])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0F766E")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), .4, colors.grey),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("PADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))
    story.append(Paragraph("Grup Adresleri", styles["Heading2"]))

    rows = [["Adres", "İsim", "DPT", "Kaynak", "Kanal"]]
    for g in gas:
        rows.append([g["address_str"], g["name"], g["dpt"], g["source"], f"K{g['channel']}"])
    t = Table(rows, colWidths=[55, 220, 90, 180, 45])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1D4ED8")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), .35, colors.grey),
        ("FONTSIZE", (0,0), (-1,-1), 7),
        ("PADDING", (0,0), (-1,-1), 3),
    ]))
    story.append(t)
    doc.build(story)
    buf.seek(0)
    return buf
