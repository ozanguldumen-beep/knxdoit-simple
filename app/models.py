from datetime import datetime, timedelta
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db, login_manager


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    plan = db.Column(db.String(50), default="trial")
    trial_start = db.Column(db.DateTime, default=datetime.utcnow)
    projects = db.relationship("Project", backref="user", lazy=True, cascade="all, delete-orphan")

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


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    channels = db.Column(db.Integer, default=1)
    channel_type = db.Column(db.String(50), default="switch")
    din_width = db.Column(db.Integer, default=4)
    is_default = db.Column(db.Boolean, default=False)


class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    ets_version = db.Column(db.String(10), default="ETS6")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    data = db.Column(db.Text, default="{}")


def seed_products():
    if Product.query.filter_by(is_default=True).first():
        return
    defaults = [
        Product(name="KNX Power Supply 640mA", category="power_supply", channels=1, channel_type="power", din_width=4, is_default=True),
        Product(name="KNX IP Interface", category="interface", channels=1, channel_type="interface", din_width=2, is_default=True),
        Product(name="KNX IP Router", category="router", channels=1, channel_type="router", din_width=2, is_default=True),
        Product(name="Switch Aktüatör 6 Kanal", category="actuator", channels=6, channel_type="switch", din_width=4, is_default=True),
        Product(name="Switch Aktüatör 12 Kanal", category="actuator", channels=12, channel_type="switch", din_width=8, is_default=True),
        Product(name="Switch Aktüatör 24 Kanal", category="actuator", channels=24, channel_type="switch", din_width=12, is_default=True),
        Product(name="Dimmer Aktüatör 4 Kanal", category="actuator", channels=4, channel_type="dimmer", din_width=4, is_default=True),
        Product(name="Dimmer Aktüatör 8 Kanal", category="actuator", channels=8, channel_type="dimmer", din_width=6, is_default=True),
        Product(name="Jalüzi/Perde Aktüatörü 4 Kanal", category="actuator", channels=4, channel_type="blind", din_width=4, is_default=True),
        Product(name="Jalüzi/Perde Aktüatörü 8 Kanal", category="actuator", channels=8, channel_type="blind", din_width=6, is_default=True),
        Product(name="Binary Input 4 Kanal", category="input", channels=4, channel_type="input", din_width=2, is_default=True),
        Product(name="Binary Input 8 Kanal", category="input", channels=8, channel_type="input", din_width=4, is_default=True),
        Product(name="1 Gang KNX Anahtar", category="field_knx", channels=1, channel_type="push", din_width=0, is_default=True),
        Product(name="2 Gang KNX Anahtar", category="field_knx", channels=2, channel_type="push", din_width=0, is_default=True),
        Product(name="4 Gang KNX Anahtar", category="field_knx", channels=4, channel_type="push", din_width=0, is_default=True),
        Product(name="Termostat", category="field_knx", channels=1, channel_type="thermostat", din_width=0, is_default=True),
    ]
    for product in defaults:
        db.session.add(product)
    db.session.commit()
