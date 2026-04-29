from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

DPT_RULES = {
    "lamp": [{"name": "Aç/Kapa", "dpt": "DPST-1-1"}, {"name": "Geri Bildirim", "dpt": "DPST-1-1"}],
    "dimmer": [{"name": "On/Off", "dpt": "DPST-1-1"}, {"name": "Dimleme", "dpt": "DPST-3-7"}, {"name": "Parlaklık", "dpt": "DPST-5-1"}],
    "blind": [{"name": "Yukarı/Aşağı", "dpt": "DPST-1-8"}, {"name": "Dur", "dpt": "DPST-1-7"}, {"name": "Pozisyon", "dpt": "DPST-5-1"}],
    "thermostat": [{"name": "Sıcaklık", "dpt": "DPST-9-1"}, {"name": "Set Değeri", "dpt": "DPST-9-1"}],
    "switch": [{"name": "Buton", "dpt": "DPST-1-1"}],
    "valve": [{"name": "Vana Aç/Kapa", "dpt": "DPST-1-1"}],
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

if __name__ == "__main__":
    app.run(debug=True)
