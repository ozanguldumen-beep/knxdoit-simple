// static/devices.js

export const DEVICES = {
  system: [
    {
      id: "psu",
      name: "KNX Power Supply",
      type: "power_supply",
      moduleWidth: 4,
      color: "#2563eb"
    },
    {
      id: "ip-interface",
      name: "KNX IP Interface",
      type: "interface",
      moduleWidth: 2,
      color: "#7c3aed"
    }
  ],

  actuators: [
    {
      id: "relay-8ch",
      name: "8CH Röle Aktüatör",
      type: "actuator",
      moduleWidth: 8,
      channels: 8,
      color: "#16a34a"
    },
    {
      id: "dimmer-4ch",
      name: "4CH Dimmer",
      type: "dimmer",
      moduleWidth: 6,
      channels: 4,
      color: "#f97316"
    },
    {
      id: "curtain-4ch",
      name: "4CH Perde Aktüatörü",
      type: "curtain_actuator",
      moduleWidth: 8,
      channels: 4,
      color: "#0f766e"
    }
  ],

  loads: [
    {
      id: "light-load",
      name: "Lamba Yükü",
      type: "light_load",
      moduleWidth: 2,
      color: "#64748b"
    },
    {
      id: "dim-light",
      name: "Dim Lamba",
      type: "dim_light",
      moduleWidth: 2,
      color: "#9333ea"
    },
    {
      id: "curtain-motor",
      name: "Perde Motoru",
      type: "curtain_motor",
      moduleWidth: 2,
      color: "#0ea5e9"
    }
  ]
};
