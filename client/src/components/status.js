export function statusColor(e) {
  switch (e) {
    case "บันทึกฉบับร่าง":
      return "grey-4";
    case "รอตรวจสอบ":
      return "amber-2";
    case "รออนุมัติ":
      return "blue-2";
    case "รอจ่ายเงิน":
      return "yellow-8";
    case "ไม่อนุมัติ":
      return "red-2";
    case "อนุมัติ":
      return "green-2";
    default:
      return "";
  }
}

export function textStatusColor(e) {
  switch (e) {
    case "บันทึกฉบับร่าง":
      return "text-grey-8";
    case "รอตรวจสอบ":
      return "text-amber-9";
    case "รออนุมัติ":
      return "text-blue-9";
    case "รอจ่ายเงิน":
      return "text-yellow-10";
    case "ไม่อนุมัติ":
      return "text-red-9";
    case "อนุมัติ":
      return "text-green-9";
    default:
      return "";
  }
}
