import io, zipfile, uuid
from datetime import datetime

DPT = {
    "light_load": [("SW", "DPST-1-1", "Aç/Kapa"), ("SW_FB", "DPST-1-1", "Aç/Kapa F.B")],
    "dim_light": [("DIM_SW", "DPST-1-1", "On/Off"), ("DIM_REL", "DPST-3-7", "Dimming"), ("DIM_VAL", "DPST-5-1", "Value"), ("DIM_VAL_FB", "DPST-5-1", "Value F.B")],
    "curtain_motor": [("BLD_MOVE", "DPST-1-8", "Up/Down"), ("BLD_STOP", "DPST-1-8", "Step/Stop"), ("BLD_POS", "DPST-5-1", "Pozisyon")],
    "thermostat": [("TEMP_SET", "DPST-9-1", "Setpoint"), ("TEMP_ACT", "DPST-9-1", "Actual"), ("TEMP_MODE", "DPST-20-102", "Mod")],
    "knx_switch": [("PUSH", "DPST-1-1", "Komut")],
    "sensor": [("SENS", "DPST-1-1", "Sensör")],
    "valve": [("VALVE", "DPST-1-1", "Vana")],
    "collector": [("COL", "DPST-1-1", "Kollektör")],
}


def addr_int(main, mid, sub):
    return (main << 11) | (mid << 8) | sub


def addr_str(n):
    return f"{(n >> 11) & 0x1F}/{(n >> 8) & 0x07}/{n & 0xFF}"


def build_gas(data):
    gas, gid = [], 1
    for fi, floor in enumerate(data.get("floors", [])):
        sub = 1
        for ri, room in enumerate(floor.get("rooms", [])):
            for dev in room.get("devices", []):
                dtype = dev.get("type", "light_load")
                dpts = DPT.get(dtype, DPT["light_load"])
                for code, dpt, suffix in dpts:
                    n = addr_int(fi + 1, ri + 1, sub)
                    gas.append({
                        "id": f"GA-{gid}",
                        "address": n,
                        "address_str": addr_str(n),
                        "name": f"{room.get('name','Oda')} {dev.get('name','Cihaz')} {suffix}",
                        "dpt": dpt,
                        "floor": floor.get("name", f"Kat {fi+1}"),
                        "room": room.get("name", "Oda"),
                        "device_type": dtype,
                    })
                    gid += 1
                    sub += 1
        for ci, collector in enumerate(floor.get("collectors", [])):
            n = addr_int(fi + 1, 7, ci + 1)
            gas.append({
                "id": f"GA-{gid}", "address": n, "address_str": addr_str(n),
                "name": f"{floor.get('name','Kat')} {collector.get('name','Kollektör')} Kontrol",
                "dpt": "DPST-1-1", "floor": floor.get("name", "Kat"), "room": "Kollektör", "device_type": "collector"
            })
            gid += 1
    return gas


def make_knxproj(project_name, data, ets_version="ETS6"):
    ns = "http://knx.org/xml/project/21" if ets_version == "ETS6" else "http://knx.org/xml/project/20"
    pid = "P-" + uuid.uuid4().hex[:4].upper()
    iid = pid + "-0"
    gas = build_gas(data)
    ga_xml = "".join(
        f'        <GroupAddress Id="{iid}_{g["id"]}" Address="{g["address"]}" Name="{g["name"]}" DatapointType="{g["dpt"]}" Puid="{i+1}" />\n'
        for i, g in enumerate(gas)
    )
    project_xml = f'''<?xml version="1.0" encoding="utf-8"?>
<KNX xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" CreatedBy="KNXdoit" ToolVersion="1.6" xmlns="{ns}">
  <Project Id="{pid}">
    <Installations>
      <Installation Name="{project_name}" BCUKey="4294967295">
        <Topology>
          <Area Id="{iid}_A-1" Address="1" Name="Alan 1" Puid="1">
            <Line Id="{iid}_L-1" Address="1" Name="Hat 1" MediumTypeRefId="MT-0" Puid="2"/>
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
    meta = f'''<?xml version="1.0" encoding="utf-8"?>
<KNX xmlns="{ns}" CreatedBy="KNXdoit" ToolVersion="1.6">
  <Project Id="{pid}" Name="{project_name}" LastModified="{datetime.now().isoformat()}" GroupAddressStyle="ThreeLevel"/>
</KNX>'''
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(f"{pid}/0.xml", project_xml)
        z.writestr(f"{pid}/project.xml", meta)
    buf.seek(0)
    return buf, gas


def make_pdf(project_name, data):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    gas = build_gas(data)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=32, bottomMargin=32)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("KNXdoit v16 - Elektrikçi Çıktısı", styles["Title"]),
        Paragraph(f"Proje: {project_name}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph("Oda / Cihaz / Grup Adresleri", styles["Heading2"]),
    ]
    rows = [["Kat", "Oda", "Cihaz/Fonksiyon", "Grup Adresi", "DPT"]]
    for g in gas:
        rows.append([g["floor"], g["room"], g["name"], g["address_str"], g["dpt"]])
    t = Table(rows, colWidths=[65, 75, 210, 70, 80])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#185FA5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f7fb")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))
    story.append(Paragraph("Not: Pano/canvas ekran görüntüsü bu rapora sonraki sürümde görsel olarak eklenecektir.", styles["Normal"]))
    doc.build(story)
    buf.seek(0)
    return buf
