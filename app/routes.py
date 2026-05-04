from flask import Blueprint, render_template, request, jsonify, send_file, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User, Product, Project
from app.knx_generator import make_knxproj, build_gas, make_pdf
import json

main = Blueprint("main", __name__)

@main.route("/")
def index():
    return render_template("index.html")

@main.route("/dashboard")
@login_required
def dashboard():
    projects = Project.query.filter_by(user_id=current_user.id).order_by(Project.created_at.desc()).all()
    return render_template("dashboard.html", projects=projects)

@main.route("/project")
@login_required
def project_alias():
    return redirect(url_for("main.new_project"))

@main.route("/project/new")
@login_required
def new_project():
    if not current_user.can_create_project():
        flash("Trial süreniz doldu veya proje limitine ulaştınız.")
        return redirect(url_for("main.dashboard"))
    return render_template("project.html", project_name="KNXdoit Projesi")

@main.route("/api/products")
@login_required
def get_products():
    products = Product.query.filter((Product.is_default == True) | (Product.user_id == current_user.id)).all()
    return jsonify([{"id": p.id, "name": p.name, "category": p.category, "channels": p.channels, "channel_type": p.channel_type, "din_width": p.din_width} for p in products])

@main.route("/api/preview", methods=["POST"])
@login_required
def preview():
    d = request.get_json(silent=True) or {}
    gas = build_gas(d)
    return jsonify({"group_addresses": gas, "total": len(gas)})

@main.route("/api/generate", methods=["POST"])
@login_required
def generate():
    d = request.get_json(silent=True) or {}
    name = d.get("project_name", "KNXdoit Projesi")
    ets = d.get("ets_version", "ETS6")
    proj = Project(user_id=current_user.id, name=name, ets_version=ets, data=json.dumps(d, ensure_ascii=False))
    db.session.add(proj); db.session.commit()
    buf, _ = make_knxproj(name, d, ets)
    return send_file(buf, as_attachment=True, download_name=f"{name}.knxproj", mimetype="application/octet-stream")

@main.route("/api/pdf", methods=["POST"])
@login_required
def pdf():
    d = request.get_json(silent=True) or {}
    name = d.get("project_name", "KNXdoit Projesi")
    buf = make_pdf(name, d)
    return send_file(buf, as_attachment=True, download_name=f"{name}_elektrikci.pdf", mimetype="application/pdf")

@main.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.new_project"))
    if request.method == "POST":
        u = User.query.filter_by(email=request.form["email"]).first()
        if u and u.check_password(request.form["password"]):
            login_user(u)
            return redirect(url_for("main.new_project"))
        flash("Hatalı email veya şifre")
    return render_template("login.html")

@main.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("main.new_project"))
    if request.method == "POST":
        email = request.form["email"]
        if User.query.filter_by(email=email).first():
            flash("Bu email zaten kayıtlı")
            return redirect(url_for("main.register"))
        u = User(email=email)
        u.set_password(request.form["password"])
        db.session.add(u); db.session.commit()
        login_user(u)
        return redirect(url_for("main.new_project"))
    return render_template("register.html")

@main.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("main.index"))
