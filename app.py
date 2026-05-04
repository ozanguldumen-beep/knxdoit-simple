from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from io import BytesIO
import os, json, zipfile, uuid

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "knxdoit-v17-secret")
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
    def set_password(self, password): self.password = generate_password_hash(password, method="pbkdf2:sha256")
    def check_password(self, password): return check_password_hash(self.password, password)
    def is_trial_active(self): return self.plan == "pro" or datetime.utcnow() < self.trial_start + timedelta(days=7)
    def project_count(self): return len(self.projects)
    def can_create_project(self): return self.plan == "pro" or (self.is_trial_active() and self.project_count() < 3)
    def days_left(self):
        if self.plan == "pro": return 999
        delta = (self.trial_start + timedelta(days=7)) - datetime.utcnow()
        return max(0, delta.days)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    ets_version = db.Column(db.String(10), default="ETS6")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    data = db.Column(db.Text, default="{}")

@login_manager.user_loader
def load_user(user_id): return User.query.get(int(user_id))

DPT = {
    "light": [("SW","DPST-1-1","Aç/Kapa"),("SW_FB","DPST-1-1","Aç/Kapa F.B")],
    "dim": [("DIM_SW","DPST-1-1","On/Off"),("DIM_REL","DPST-3-7","Dimming"),("DIM_VAL","DPST-5-1","Value"),("DIM_VAL_FB","DPST-5-1","Value F.B")],
    "curtain": [("BLD_MOVE","DPST-1-8","Up/Down"),("BLD_STOP","DPST-1-8","Step/Stop"),("BLD_POS","DPST-5-1","Pozisyon"),("BLD_POS_FB","DPST-5-1","Pozisyon F.B")],
    "thermostat": [("TEMP_SET","DPST-9-1","Setpoint"),("TEMP_ACT","DPST-9-1","Aktual"),("TEMP_MODE","DPST-20-102","Mod"),("TEMP_FB","DPST-9-1","Setpoint F.B")],
    "switch": [("PUSH","DPST-1-1","Komut")],
    "sensor": [("SENS","DPST-1-1","Sensör")],
    "valve": [("VALVE","DPST-1-1","Vana Aç/Kapa")],
}

@app.before_request
def init_db():
    db.create_all()

def build_gas(data):
    gas, gid = [], 1
    for fi, floor in enumerate(data.get("floors", []), start=1):
        mid = 1
        for room in floor.get("rooms", []):
            sub = 1
            for dev in room.get("devices", []):
                dpts = DPT.get(dev.get("type"), DPT["light"])
                count = int(dev.get("count", 1) or 1)
                for i in range(1, count + 1):
                    for _, dpt, suffix in dpts:
                        gas.append({"id": gid, "address": f"{fi}/{mid}/{sub}", "floor": floor.get("name","Kat"), "room": room.get("name","Oda"), "device": dev.get("label","Cihaz"), "function": suffix, "dpt": dpt})
                        gid += 1; sub += 1
            mid += 1
    return gas

def make_pdf(data):
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), topMargin=28, bottomMargin=28, leftMargin=28, rightMargin=28)
    styles = getSampleStyleSheet()
    gas = build_gas(data)
    story = [Paragraph("KNXdoit v17 - Elektrikçi Çıktısı", styles["Title"]), Paragraph(f"Proje: {data.get('project_name','KNXdoit Projesi')} | ETS: {data.get('ets_version','ETS6')}", styles["Normal"]), Spacer(1, 12)]
    rows = [["Kat","Oda","Cihaz","Fonksiyon","Grup Adresi","DPT"]] + [[g["floor"], g["room"], g["device"], g["function"], g["address"], g["dpt"]] for g in gas]
    t = Table(rows, colWidths=[90,100,130,150,80,90])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#185FA5")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#CBD5E1")),("FONTSIZE",(0,0),(-1,-1),8),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
    story.append(t); doc.build(story); buf.seek(0); return buf

def make_knxproj(data):
    gas = build_gas(data)
    pid = "P-" + uuid.uuid4().hex[:6].upper()
    project_name = data.get("project_name", "KNXdoit Projesi")
    lines = []
    for i, g in enumerate(gas, start=1):
        main, mid, sub = [int(x) for x in g["address"].split("/")]
        addr_int = (main << 11) | (mid << 8) | sub
        name = f'{g["floor"]} {g["room"]} {g["device"]} {g["function"]}'
        lines.append(f'          <GroupAddress Id="{pid}_GA{i}" Address="{addr_int}" Name="{name}" DatapointType="{g["dpt"]}" Puid="{i}" />')
    ga_xml = "\\n".join(lines)
    xml = f"""<?xml version="1.0" encoding="utf-8"?>
<KNX xmlns="http://knx.org/xml/project/21" CreatedBy="KNXdoit" ToolVersion="v17">
  <Project Id="{pid}">
    <Installations>
      <Installation Name="{project_name}" GroupAddressStyle="ThreeLevel">
        <Topology><Area Address="1" Name="Alan 1"><Line Address="1" Name="Hat 1"/></Area></Topology>
        <GroupAddresses><GroupRanges><GroupRange Name="{project_name}" RangeStart="1" RangeEnd="65535">
{ga_xml}
        </GroupRange></GroupRanges></GroupAddresses>
      </Installation>
    </Installations>
  </Project>
</KNX>"""
    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(f"{pid}/0.xml", xml)
        z.writestr(f"{pid}/project.xml", f"<Project Id='{pid}' Name='{project_name}'/>")
    buf.seek(0); return buf

@app.route("/")
def index(): return render_template("index.html")
@app.route("/dashboard")
@login_required
def dashboard():
    projects = Project.query.filter_by(user_id=current_user.id).order_by(Project.created_at.desc()).all()
    return render_template("dashboard.html", projects=projects)
@app.route("/project")
@login_required
def project(): return redirect(url_for("new_project"))
@app.route("/project/new")
@login_required
def new_project():
    if not current_user.can_create_project():
        flash("Trial süreniz doldu veya proje limitine ulaştınız.")
        return redirect(url_for("dashboard"))
    return render_template("project.html")
@app.route("/api/save", methods=["POST"])
@login_required
def save_project():
    d = request.get_json(silent=True) or {}
    p = Project(user_id=current_user.id, name=d.get("project_name") or "KNXdoit Projesi", ets_version=d.get("ets_version") or "ETS6", data=json.dumps(d, ensure_ascii=False))
    db.session.add(p); db.session.commit()
    return jsonify({"ok": True, "id": p.id})
@app.route("/api/preview", methods=["POST"])
@login_required
def preview():
    gas = build_gas(request.get_json(silent=True) or {})
    return jsonify({"ok": True, "group_addresses": gas, "total": len(gas)})
@app.route("/api/pdf", methods=["POST"])
@login_required
def pdf():
    d = request.get_json(silent=True) or {}
    return send_file(make_pdf(d), as_attachment=True, download_name=f'{d.get("project_name","KNXdoit")}_elektrikci.pdf', mimetype="application/pdf")
@app.route("/api/generate", methods=["POST"])
@login_required
def generate():
    d = request.get_json(silent=True) or {}
    return send_file(make_knxproj(d), as_attachment=True, download_name=f'{d.get("project_name","KNXdoit")}.knxproj', mimetype="application/octet-stream")
@app.route("/login", methods=["GET","POST"])
def login():
    if current_user.is_authenticated: return redirect(url_for("new_project"))
    if request.method == "POST":
        u = User.query.filter_by(email=request.form.get("email")).first()
        if u and u.check_password(request.form.get("password","")):
            login_user(u); return redirect(url_for("new_project"))
        flash("Hatalı email veya şifre")
    return render_template("login.html")
@app.route("/register", methods=["GET","POST"])
def register():
    if current_user.is_authenticated: return redirect(url_for("new_project"))
    if request.method == "POST":
        email = request.form.get("email","").strip().lower()
        if User.query.filter_by(email=email).first():
            flash("Bu email zaten kayıtlı"); return redirect(url_for("register"))
        u = User(email=email); u.set_password(request.form.get("password",""))
        db.session.add(u); db.session.commit(); login_user(u)
        return redirect(url_for("new_project"))
    return render_template("register.html")
@app.route("/logout")
@login_required
def logout():
    logout_user(); return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(debug=True)
