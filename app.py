from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from io import BytesIO
import os, json, uuid, zipfile

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "knxdoit-v13-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///knxdoit.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    plan = db.Column(db.String(50), default="trial")
    trial_start = db.Column(db.DateTime, default=datetime.utcnow)
    projects = db.relationship("Project", backref="user", lazy=True)

    def set_password(self, password):
        self.password = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def is_trial_active(self):
        if self.plan == "pro":
            return True
        return datetime.utcnow() < self.trial_start + timedelta(days=7)

    def project_count(self):
        return len(self.projects)

    def can_create_project(self):
        if self.plan == "pro":
            return True
        return self.is_trial_active() and self.project_count() < 3

    def days_left(self):
        if self.plan == "pro":
            return 999
        delta = (self.trial_start + timedelta(days=7)) - datetime.utcnow()
        return max(0, delta.days)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), default="actuator")
    channels = db.Column(db.Integer, default=1)
    channel_type = db.Column(db.String(50), default="switch")
    module_width = db.Column(db.Integer, default=4)
    color = db.Column(db.String(20), default="#2563eb")
    is_default = db.Column(db.Boolean, default=False)


class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    ets_version = db.Column(db.String(10), default="ETS6")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    data = db.Column(db.Text, default="{}")


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def seed_products():
    if Product.query.filter_by(is_default=True).first():
        return
    defaults = [
        ("KNX Power Supply 640mA", "system", "power_supply", 1, "power", 4, "#2563eb"),
        ("KNX IP Interface", "system", "interface", 1, "interface", 2, "#7c3aed"),
        ("KNX IP Router", "system", "router", 1, "router", 2, "#4f46e5"),
        ("Switch Aktüatör 6 Kanal", "actuator", "actuator", 6, "switch", 4, "#16a34a"),
        ("Switch Aktüatör 12 Kanal", "actuator", "actuator", 12, "switch", 8, "#16a34a"),
        ("Switch Aktüatör 24 Kanal", "actuator", "actuator", 24, "switch", 12, "#15803d"),
        ("Dimmer Aktüatör 4 Kanal", "actuator", "dimmer", 4, "dimmer", 4, "#f97316"),
        ("Dimmer Aktüatör 8 Kanal", "actuator", "dimmer", 8, "dimmer", 6, "#ea580c"),
        ("Jalüzi/Perde Aktüatörü 4 Kanal", "actuator", "curtain_actuator", 4, "blind", 4, "#0f766e"),
        ("Jalüzi/Perde Aktüatörü 8 Kanal", "actuator", "curtain_actuator", 8, "blind", 6, "#0d9488"),
        ("Binary Input 4 Kanal", "input", "binary_input", 4, "input", 2, "#64748b"),
        ("Binary Input 8 Kanal", "input", "binary_input", 8, "input", 4, "#475569"),
        ("1 Gang KNX Anahtar", "field", "knx_switch", 1, "push", 0, "#3b82f6"),
        ("2 Gang KNX Anahtar", "field", "knx_switch", 2, "push", 0, "#3b82f6"),
        ("4 Gang KNX Anahtar", "field", "knx_switch", 4, "push", 0, "#3b82f6"),
        ("Termostat", "field", "thermostat", 1, "thermostat", 0, "#be123c"),
        ("Lamba Yükü", "load", "light_load", 1, "switch", 0, "#f59e0b"),
        ("Dim Lamba", "load", "dim_light", 1, "dimmer", 0, "#9333ea"),
        ("Perde Motoru", "load", "curtain_motor", 1, "blind", 0, "#0ea5e9"),
    ]
    for name, category, typ, channels, channel_type, module_width, color in defaults:
        db.session.add(Product(name=name, category=category, type=typ, channels=channels, channel_type=channel_type,
                               module_width=module_width, color=color, is_default=True))
    db.session.commit()


def product_to_dict(p):
    return {
        "id": f"db-{p.id}", "dbId": p.id, "name": p.name, "category": p.category, "type": p.type,
        "channels": p.channels, "channelType": p.channel_type, "moduleWidth": p.module_width,
        "color": p.color, "isDefault": p.is_default
    }

DPT = {
    "light_load": [("SW", "DPST-1-1", "Aç/Kapa"), ("SW_FB", "DPST-1-1", "Aç/Kapa F.B")],
    "dim_light": [("DIM_SW", "DPST-1-1", "On/Off"), ("DIM_REL", "DPST-3-7", "Dimming"), ("DIM_VAL", "DPST-5-1", "Value"), ("DIM_FB", "DPST-5-1", "Value F.B")],
    "curtain_motor": [("BLD_MOVE", "DPST-1-8", "Up/Down"), ("BLD_STOP", "DPST-1-8", "Step/Stop"), ("BLD_POS", "DPST-5-1", "Pozisyon"), ("BLD_FB", "DPST-5-1", "Pozisyon F.B")],
    "knx_switch": [("PUSH", "DPST-1-1", "Buton"), ("PUSH_FB", "DPST-1-1", "Buton F.B")],
    "thermostat": [("TEMP_SET", "DPST-9-1", "Setpoint"), ("TEMP_ACT", "DPST-9-1", "Aktüel"), ("TEMP_MODE", "DPST-20-102", "Mod")],
}


def build_group_addresses(data):
    addresses = []
    main, middle, counter = 1, 1, 1
    devices = data.get("devices", [])
    for device in devices:
        name = device.get("name", "Cihaz")
        conns = device.get("connections", [])
        if not conns:
            channels = int(device.get("channels") or 1)
            for ch in range(1, channels + 1):
                addresses.append({"device": name, "channel": ch, "address": f"{main}/{middle}/{counter}", "function": f"{name} Kanal {ch}", "dpt": "DPST-1-1"})
                counter += 1
        for conn in conns:
            target_type = conn.get("targetType", "light_load")
            dpts = DPT.get(target_type, DPT["light_load"])
            for _, dpt, suffix in dpts:
                addresses.append({
                    "device": conn.get("targetName", name),
                    "channel": conn.get("channel", 1),
                    "address": f"{main}/{middle}/{counter}",
                    "function": f"{conn.get('targetName', name)} {suffix}",
                    "dpt": dpt
                })
                counter += 1
    return addresses


def make_knxproj(project_name, data, ets_version="ETS6"):
    ns = "http://knx.org/xml/project/21" if ets_version == "ETS6" else "http://knx.org/xml/project/20"
    pid = "P-" + uuid.uuid4().hex[:4].upper()
    iid = pid + "-0"
    gas = build_group_addresses(data)
    ga_xml = ""
    for i, g in enumerate(gas):
        main, mid, sub = [int(x) for x in g["address"].split("/")]
        address_int = (main << 11) | (mid << 8) | sub
        safe_name = str(g["function"]).replace("&", "and").replace('"', "'")
        ga_xml += f'        <GroupAddress Id="{iid}_GA-{i+1}" Address="{address_int}" Name="{safe_name}" DatapointType="{g.get("dpt", "DPST-1-1")}" Puid="{i+1}" />\n'
    proj = f'''<?xml version="1.0" encoding="utf-8"?>
<KNX xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" CreatedBy="KNXdoit" ToolVersion="1.0" xmlns="{ns}">
  <Project Id="{pid}">
    <Installations><Installation Name="{project_name}" BCUKey="4294967295">
      <Topology><Area Id="{iid}_A-1" Address="1" Name="Alan 1" Puid="1"><Line Id="{iid}_L-1" Address="1" Name="Hat 1" MediumTypeRefId="MT-0" Puid="2"/></Area></Topology>
      <GroupAddresses><GroupRanges><GroupRange Id="{iid}_GR-1" RangeStart="1" RangeEnd="65535" Name="{project_name}" Puid="3">
{ga_xml}      </GroupRange></GroupRanges></GroupAddresses>
    </Installation></Installations>
  </Project>
</KNX>'''
    meta = f'''<?xml version="1.0" encoding="utf-8"?><KNX xmlns="{ns}" CreatedBy="KNXdoit" ToolVersion="1.0"><Project Id="{pid}" Name="{project_name}" LastModified="{datetime.now().isoformat()}" GroupAddressStyle="ThreeLevel"/></KNX>'''
    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(f"{pid}/0.xml", proj)
        z.writestr(f"{pid}/project.xml", meta)
    buf.seek(0)
    return buf


def make_pdf(project_name, data):
    gas = build_group_addresses(data)
    devices = data.get("devices", [])
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=38, bottomMargin=38)
    styles = getSampleStyleSheet()
    story = [Paragraph("KNXdoit — Elektrikçi Pano Raporu", styles["Title"]), Paragraph(f"Proje: {project_name}", styles["Normal"]), Spacer(1, 14)]
    rows = [["Ürün", "Tip", "M", "Kanal", "Bağlantı"]]
    for d in devices:
        rows.append([d.get("name", "-"), d.get("type", "-"), str(d.get("moduleWidth", "-")), str(d.get("channels", "-")), str(len(d.get("connections", [])))])
    t = Table(rows, colWidths=[160, 90, 40, 50, 70])
    t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#185FA5")), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("GRID", (0,0), (-1,-1), .5, colors.grey), ("FONTSIZE", (0,0), (-1,-1), 8)]))
    story += [Paragraph("Ürün Listesi", styles["Heading2"]), t, Spacer(1, 16)]
    ga_rows = [["Grup Adresi", "Fonksiyon", "DPT"]] + [[g["address"], g["function"], g.get("dpt", "")] for g in gas]
    gt = Table(ga_rows, colWidths=[70, 260, 80])
    gt.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#185FA5")), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("GRID", (0,0), (-1,-1), .5, colors.grey), ("FONTSIZE", (0,0), (-1,-1), 7)]))
    story += [Paragraph("Grup Adresleri", styles["Heading2"]), gt]
    doc.build(story)
    buf.seek(0)
    return buf


@app.before_request
def setup_db():
    if not hasattr(app, "_db_ready"):
        db.create_all()
        seed_products()
        app._db_ready = True


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/project")
@login_required
def project():
    if not current_user.can_create_project():
        flash("Trial süreniz doldu veya proje limitine ulaştınız.")
        return redirect(url_for("dashboard"))
    return render_template("project.html")

@app.route("/dashboard")
@login_required
def dashboard():
    projects = Project.query.filter_by(user_id=current_user.id).order_by(Project.created_at.desc()).all()
    return render_template("dashboard.html", projects=projects)

@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        u = User.query.filter_by(email=request.form.get("email", "").lower()).first()
        if u and u.check_password(request.form.get("password", "")):
            login_user(u)
            return redirect(url_for("project"))
        flash("Hatalı email veya şifre")
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("project"))
    if request.method == "POST":
        email = request.form.get("email", "").lower().strip()
        if User.query.filter_by(email=email).first():
            flash("Bu email zaten kayıtlı")
            return redirect(url_for("register"))
        u = User(email=email)
        u.set_password(request.form.get("password", ""))
        db.session.add(u)
        db.session.commit()
        login_user(u)
        return redirect(url_for("project"))
    return render_template("register.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("index"))

@app.route("/api/products")
@login_required
def api_products():
    products = Product.query.filter((Product.is_default == True) | (Product.user_id == current_user.id)).all()
    return jsonify([product_to_dict(p) for p in products])

@app.route("/api/products", methods=["POST"])
@login_required
def api_add_product():
    d = request.get_json(silent=True) or {}
    p = Product(user_id=current_user.id, name=d.get("name", "Yeni Ürün"), category=d.get("category", "actuator"),
                type=d.get("type", "actuator"), channels=int(d.get("channels", 1)), channel_type=d.get("channelType", "switch"),
                module_width=int(d.get("moduleWidth", 4)), color=d.get("color", "#2563eb"), is_default=False)
    db.session.add(p); db.session.commit()
    return jsonify({"ok": True, "product": product_to_dict(p)})

@app.route("/api/group-addresses", methods=["POST"])
@login_required
def api_group_addresses():
    data = request.get_json(silent=True) or {}
    return jsonify({"ok": True, "addresses": build_group_addresses(data)})

@app.route("/api/save-project", methods=["POST"])
@login_required
def api_save_project():
    data = request.get_json(silent=True) or {}
    name = data.get("projectName", "KNXdoit Projesi")
    ets = data.get("etsVersion", "ETS6")
    proj = Project(user_id=current_user.id, name=name, ets_version=ets, data=json.dumps(data, ensure_ascii=False))
    db.session.add(proj); db.session.commit()
    return jsonify({"ok": True, "projectId": proj.id})

@app.route("/api/knxproj", methods=["POST"])
@login_required
def api_knxproj():
    data = request.get_json(silent=True) or {}
    name = data.get("projectName", "KNXdoit Projesi")
    ets = data.get("etsVersion", "ETS6")
    buf = make_knxproj(name, data, ets)
    return send_file(buf, as_attachment=True, download_name=f"{name}.knxproj", mimetype="application/octet-stream")

@app.route("/api/pdf", methods=["POST"])
@login_required
def api_pdf():
    data = request.get_json(silent=True) or {}
    name = data.get("projectName", "KNXdoit Projesi")
    buf = make_pdf(name, data)
    return send_file(buf, as_attachment=True, download_name=f"{name}_pano_raporu.pdf", mimetype="application/pdf")

if __name__ == "__main__":
    with app.app_context():
        db.create_all(); seed_products()
    app.run(debug=True, port=int(os.environ.get("PORT", 5002)))
