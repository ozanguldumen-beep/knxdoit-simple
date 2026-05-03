export const DEVICES = {
  system: [
    {
      id: 'psu-640',
      name: 'KNX Power Supply',
      type: 'power_supply',
      moduleWidth: 4,
      channels: 1,
      color: '#2563eb'
    },
    {
      id: 'ip-interface',
      name: 'KNX IP Interface',
      type: 'interface',
      moduleWidth: 2,
      channels: 1,
      color: '#6d28d9'
    }
  ],
  actuators: [
    {
      id: 'relay-8ch',
      name: '8CH Röle Aktüatör',
      type: 'actuator',
      moduleWidth: 8,
      channels: 8,
      color: '#16a34a'
    },
    {
      id: 'dimmer-4ch',
      name: '4CH Dimmer',
      type: 'dimmer',
      moduleWidth: 6,
      channels: 4,
      color: '#f97316'
    },
    {
      id: 'curtain-4ch',
      name: '4CH Perde Aktüatörü',
      type: 'curtain_actuator',
      moduleWidth: 8,
      channels: 4,
      color: '#0f766e'
    }
  ],
  loads: [
    {
      id: 'load-light',
      name: 'Lamba Yükü',
      type: 'load_light',
      moduleWidth: 2,
      channels: 1,
      color: '#64748b'
    },
    {
      id: 'load-dim-light',
      name: 'Dim Lamba',
      type: 'load_dim_light',
      moduleWidth: 2,
      channels: 1,
      color: '#64748b'
    },
    {
      id: 'load-curtain',
      name: 'Perde Motoru',
      type: 'load_curtain',
      moduleWidth: 2,
      channels: 1,
      color: '#64748b'
    }
  ]
};
