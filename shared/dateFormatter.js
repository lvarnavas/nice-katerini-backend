function dateFormatter() {
  const date = new Date();

  // Get the first day of the current month
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayLocal = new Intl.DateTimeFormat("el-GR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const firstDayWithSlashes = firstDayLocal.format(firstDay);
  const firstDayParts = firstDayWithSlashes.split("/");
  const formattedFirstDay =
    firstDayParts[2] + "-" + firstDayParts[1] + "-" + firstDayParts[0];

  // Get the last day of the current month
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const lastDayLocal = new Intl.DateTimeFormat("el-GR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const lastDayWithSlashes = lastDayLocal.format(lastDay);
  const lastDayParts = lastDayWithSlashes.split("/");
  const formattedLastDay =
    lastDayParts[2] + "-" + lastDayParts[1] + "-" + lastDayParts[0];

  // Get the first day of the previous month
  const firstDayPrevMonth = new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1
  );
  const firstDayPrevMonthLocal = new Intl.DateTimeFormat("el-GR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const firstDayPrevMonthWithSlashes =
    firstDayPrevMonthLocal.format(firstDayPrevMonth);
  const firstDayPrevMonthParts = firstDayPrevMonthWithSlashes.split("/");
  const formattedFirstDayPrevMonth =
    firstDayPrevMonthParts[2] +
    "-" +
    firstDayPrevMonthParts[1] +
    "-" +
    firstDayPrevMonthParts[0];

  return {
    firstDayCurrentMonth: formattedFirstDay,
    lastDayCurrentMonth: formattedLastDay,
    firstDayPrevMonth: formattedFirstDayPrevMonth,
  };
}

module.exports = dateFormatter;
