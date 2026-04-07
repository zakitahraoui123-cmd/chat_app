const MAP = new Map([
  [0, { label: "Clear", icon: "☀️" }],
  [1, { label: "Mostly clear", icon: "🌤" }],
  [2, { label: "Partly cloudy", icon: "⛅" }],
  [3, { label: "Overcast", icon: "☁️" }],
  [45, { label: "Fog", icon: "🌫" }],
  [48, { label: "Rime fog", icon: "🌫" }],
  [51, { label: "Light drizzle", icon: "🌦" }],
  [53, { label: "Drizzle", icon: "🌦" }],
  [55, { label: "Heavy drizzle", icon: "🌧" }],
  [61, { label: "Light rain", icon: "🌧" }],
  [63, { label: "Rain", icon: "🌧" }],
  [65, { label: "Heavy rain", icon: "🌧" }],
  [71, { label: "Light snow", icon: "🌨" }],
  [73, { label: "Snow", icon: "🌨" }],
  [75, { label: "Heavy snow", icon: "❄️" }],
  [80, { label: "Rain showers", icon: "🌦" }],
  [81, { label: "Showers", icon: "🌦" }],
  [82, { label: "Heavy showers", icon: "⛈" }],
  [95, { label: "Thunderstorm", icon: "⛈" }],
  [96, { label: "Thunderstorm + hail", icon: "⛈" }],
  [99, { label: "Thunderstorm + hail", icon: "⛈" }],
]);

export function describeWeather(code) {
  return MAP.get(Number(code)) || { label: "Weather", icon: "🌡" };
}

