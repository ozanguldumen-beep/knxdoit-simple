from flask import Flask, render_template, request, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/group-addresses', methods=['POST'])
def group_addresses():
    data = request.get_json(silent=True) or {}
    devices = data.get('devices', [])
    addresses = []
    main = 1
    middle = 0
    sub = 1
    for device in devices:
        name = device.get('name', 'Device')
        channels = int(device.get('channels') or device.get('moduleWidth') or 1)
        for ch in range(1, channels + 1):
            addresses.append({
                'device': name,
                'channel': ch,
                'address': f'{main}/{middle}/{sub}',
                'description': f'{name} Kanal {ch}'
            })
            sub += 1
            if sub > 255:
                sub = 1
                middle += 1
    return jsonify({'addresses': addresses})

@app.route('/api/pdf', methods=['POST'])
def pdf_report():
    data = request.get_json(silent=True) or {}
    return jsonify({
        'ok': True,
        'message': 'PDF raporu için veri alındı.',
        'created_at': datetime.utcnow().isoformat(),
        'device_count': len(data.get('devices', []))
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
