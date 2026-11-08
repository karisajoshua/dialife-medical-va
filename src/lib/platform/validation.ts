import {
  fieldsFor,
  optionsFor,
  type Resource,
  type PlatformRole,
} from "./resources";
export function validatePayload(
  key: string,
  resource: Resource,
  role: PlatformRole,
  input: Record<string, unknown>,
  editing: boolean,
) {
  const fields = fieldsFor(resource, role, editing),
    allowed = new Set(fields.map((f) => f.key));
  if (Object.keys(input).some((k) => !allowed.has(k)))
    throw new Error("The request contains protected or unsupported fields.");
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    let value = input[field.key];
    if (value === undefined) {
      if (editing) continue;
      if (field.defaultValue !== undefined) value = field.defaultValue;
      else if (field.required) throw new Error(`${field.label} is required.`);
      else continue;
    }
    if (field.type === "checkbox") {
      if (typeof value !== "boolean")
        throw new Error(`${field.label} must be true or false.`);
      payload[field.key] = value;
      continue;
    }
    if (value === null || value === "") {
      if (field.required) throw new Error(`${field.label} is required.`);
      payload[field.key] =
        ["url", "date", "datetime-local", "number"].includes(
          field.type || "",
        ) || field.relation
          ? null
          : "";
      continue;
    }
    if (field.type === "number") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        (field.key !== "score" && !Number.isInteger(value))
      )
        throw new Error(`${field.label} must be a valid number.`);
      if (
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max)
      )
        throw new Error(`${field.label} is outside the allowed range.`);
      payload[field.key] = value;
      continue;
    }
    if (typeof value !== "string")
      throw new Error(`${field.label} must be text.`);
    const textValue = value.trim();
    if (field.required && !textValue)
      throw new Error(`${field.label} is required.`);
    if (
      textValue.length >
      (field.max || (field.type === "textarea" ? 10000 : 1000))
    )
      throw new Error(`${field.label} is too long.`);
    const textValues = optionsFor(key, field, role);
    if (textValues && !textValues.includes(textValue))
      throw new Error(`Choose a valid ${field.label.toLowerCase()}.`);
    if (
      field.relation &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        textValue,
      )
    )
      throw new Error(`Choose a valid ${field.label.toLowerCase()}.`);
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textValue))
      throw new Error("Enter a valid email address.");
    if (field.type === "url") {
      try {
        const url = new URL(textValue);
        if (!["https:", "http:"].includes(url.protocol)) throw new Error();
      } catch {
        throw new Error(`${field.label} must be an HTTP or HTTPS URL.`);
      }
    }
    if (
      field.type === "date" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(textValue) ||
        Number.isNaN(Date.parse(textValue)))
    )
      throw new Error(`${field.label} must be a valid date.`);
    if (field.type === "datetime-local" && Number.isNaN(Date.parse(textValue)))
      throw new Error(`${field.label} must be a valid date and time.`);
    if (field.key === "time_zone") {
      try {
        new Intl.DateTimeFormat("en", { timeZone: textValue });
      } catch {
        throw new Error(
          "Enter a valid IANA time zone, such as Africa/Nairobi.",
        );
      }
    }
    payload[field.key] = textValue;
  }
  if (key === "progress" && "completed" in payload)
    payload.completed_at = payload.completed ? new Date().toISOString() : null;
  return payload;
}
