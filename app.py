from flask import Flask, render_template, request, jsonify, send_file
from io import BytesIO
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
import base64

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/group-addresses", methods=["POST"])
def group_addresses():
    data = request.get_json(silent=True) or {}
    devices = data.get("devices", [])

    addresses = []
    main = 1
    middle = 1
    counter = 1

    for device in devices:
        name = device.get("name", "Cihaz")
        channels = int(device.get("channels") or 1)

        for ch in range(1, channels + 1):
            addresses.append({
                "device": name,
                "channel": ch,
                "address": f"{main}/{middle}/{counter}",
                "function": f"{name} Kanal {ch}"
            })
            counter += 1

    return jsonify({"ok": True, "addresses": addresses})


@app.route("/api/pdf", methods=["POST"])
def create_pdf():
    data = request.get_json(silent=True) or {}
    devices = data.get("devices", [])
    connections = data.get("connections", [])
    group_addresses = data.get("groupAddresses", [])
    image_data_url = data.get("imageDataUrl")

    buffer = BytesIO()
    p = pdf_canvas.Canvas(buffer, pagesize=A4)
    page_w, page_h = A4

    def header(title="KNXdoit v12 - Pano Raporu"):
        p.setFont("Helvetica-Bold", 16)
        p.drawString(45, page_h - 45, title)
        p.setFont("Helvetica", 9)
        p.drawString(45, page_h - 62, "Bu rapor KNXdoit tarafindan otomatik olusturulmustur.")
        p.line(45, page_h - 75, page_w - 45, page_h - 75)

    def new_page(title="KNXdoit v12 - Pano Raporu"):
        p.showPage()
        header(title)
        return page_h - 100

    header()
    y = page_h - 100

    if image_data_url and image_data_url.startswith("data:image"):
        try:
            img_base64 = image_data_url.split(",", 1)[1]
            img_bytes = BytesIO(base64.b64decode(img_base64))
            img = ImageReader(img_bytes)
            img_w, img_h = img.getSize()
            max_w = page_w - 90
            max_h = 330
            ratio = min(max_w / img_w, max_h / img_h)
            draw_w = img_w * ratio
            draw_h = img_h * ratio
            p.drawImage(img, 45, y - draw_h, width=draw_w, height=draw_h, preserveAspectRatio=True, mask="auto")
            y -= draw_h + 30
        except Exception:
            p.setFont("Helvetica", 10)
            p.drawString(45, y, "Pano gorseli PDF'e eklenemedi.")
            y -= 25

    p.setFont("Helvetica-Bold", 12)
    p.drawString(45, y, "Urun Listesi")
    y -= 20
    p.setFont("Helvetica", 9)

    if not devices:
        p.drawString(55, y, "Henuz urun eklenmedi.")
        y -= 16
    else:
        for i, device in enumerate(devices, start=1):
            if y < 70:
                y = new_page()
            name = device.get("name", "Cihaz")
            module_width = device.get("moduleWidth", "-")
            channels = device.get("channels", "-")
            p.drawString(55, y, f"{i}. {name} | {module_width}M | Kanal: {channels}")
            y -= 15

    y -= 15
    if y < 120:
        y = new_page()

    p.setFont("Helvetica-Bold", 12)
    p.drawString(45, y, "Baglanti Listesi")
    y -= 20
    p.setFont("Helvetica", 9)

    if not connections:
        p.drawString(55, y, "Henuz baglanti yok.")
        y -= 16
    else:
        for i, conn in enumerate(connections, start=1):
            if y < 70:
                y = new_page()
            source = conn.get("sourceName", "Aktuator")
            target = conn.get("targetName", "Yuk")
            channel = conn.get("channel", "-")
            p.drawString(55, y, f"{i}. {source} - Kanal {channel} -> {target}")
            y -= 15

    y -= 15
    if y < 120:
        y = new_page()

    p.setFont("Helvetica-Bold", 12)
    p.drawString(45, y, "Grup Adresleri")
    y -= 20
    p.setFont("Helvetica", 9)

    if not group_addresses:
        p.drawString(55, y, "Grup adresi olusturulmadi.")
    else:
        for item in group_addresses:
            if y < 70:
                y = new_page()
            address = item.get("address", "-")
            function = item.get("function", "-")
            p.drawString(55, y, f"{address} | {function}")
            y -= 15

    p.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="knxdoit-pano-raporu.pdf",
        mimetype="application/pdf"
    )


if __name__ == "__main__":
    app.run(debug=True, port=5002)
