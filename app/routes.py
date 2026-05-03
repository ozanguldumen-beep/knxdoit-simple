import json
from flask import Blueprint, render_template, request, jsonify, send_file, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User, Product, Project
from app.knx_generator import make_knxproj, make_pdf, build_gas

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/dashboard")
@login_required
def dashboard():
    projects = Project.query.filter_by(user_id=current_user.id).order_by(Project.created_at.desc()).all()
    return render_template("dashboard.html", projects=projects)


@main.route("/project/new")
@login_required
def new_project():
    if not current_user.can_create_project():
        flash("Trial süreniz doldu veya proje limitine ulaştınız.")
        return redirect(url_for("main.dashboard"))
    return render_template("project.html", project_name="KNXdoit Projesi")


@main.route("/api/products", methods=["GET"])
@login_required
def get_products():
    products = Product.query.filter((Product.is_default == True) | (Product.user_id == current_user.id)).all()
    return jsonify([
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "channels": p.channels,
            "channel_type": p.channel_type,
            "din_width": p.din_width,
        }
        for p in products
    ])


@main.route("/api/products", methods=["POST"])
@login_required
def add_product():
    d = request.get_json(silent=True) or {}
    p = Product(
        user_id=current_user.id,
        name=d.get("name", "Yeni Ürün"),
        category=d.get("category", "actuator"),
        channels=int(d.get("channels", 1)),
        channel_type=d.get("channel_type", "switch"),
        din_width=int(d.get("din_width", 4)),
        is_default=False,
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({"success": True, "id": p.id})


@main.route("/api/group-addresses", methods=["POST"])
@login_required
def group_addresses():
    d = request.get_json(silent=True) or {}
    gas = build_gas(d)
    return jsonify({"ok": True, "addresses": gas, "total": len(gas)})


@main.route("/api/save-project", methods=["POST"])
@login_required
def save_project():
    d = request.get_json(silent=True) or {}
    name = d.get("project_name", "KNXdoit Projesi")
    ets = d.get("ets_version", "ETS6")
    project = Project(user_id=current_user.id, name=name, ets_version=ets, data=json.dumps(d, ensure_ascii=False))
    db.session.add(project)
    db.session.commit()
    return jsonify({"ok": True, "project_id": project.id})


@main.route("/api/generate", methods=["POST"])
@login_required
def generate():
    d = request.get_json(silent=True) or {}
    name = d.get("project_name", "KNXdoit Projesi")
    ets = d.get("ets_version", "ETS6")
    project = Project(user_id=current_user.id, name=name, ets_version=ets, data=json.dumps(d, ensure_ascii=False))
    db.session.add(project)
    db.session.commit()
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
        user = User.query.filter_by(email=request.form.get("email")).first()
        if user and user.check_password(request.form.get("password", "")):
            login_user(user)
            return redirect(url_for("main.new_project"))
        flash("Hatalı email veya şifre")
    return render_template("login.html")


@main.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("main.new_project"))
    if request.method == "POST":
        email = request.form.get("email")
        if User.query.filter_by(email=email).first():
            flash("Bu email zaten kayıtlı")
            return redirect(url_for("main.register"))
        user = User(email=email)
        user.set_password(request.form.get("password", ""))
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return redirect(url_for("main.new_project"))
    return render_template("register.html")


@main.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("main.index"))
