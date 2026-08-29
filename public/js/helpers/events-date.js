const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const splitEventsByDate = (events, todayString) => {
  const upcomingEvents = [];
  const oldEvents = [];
  if (!Array.isArray(events)) return { upcomingEvents, oldEvents };

  for (const event of events) {
    if (isUpcomingEvent(event, todayString)) {
      upcomingEvents.push(event);
      continue;
    }

    oldEvents.push(event);
  }

  upcomingEvents.sort(compareDatesAscending);
  oldEvents.sort(compareOldEventsDescending);
  return { upcomingEvents, oldEvents };
};

export const isCanonicalDateString = (dateString) => {
  if (typeof dateString !== "string" || !DATE_PATTERN.test(dateString)) return false;

  const year = Number(dateString.slice(0, 4));
  const month = Number(dateString.slice(5, 7));
  const day = Number(dateString.slice(8, 10));
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;

  return day <= getDaysInMonth(year, month);
};

const isUpcomingEvent = (event, todayString) => {
  if (!event || !isCanonicalDateString(event.eventDate)) return false;
  if (!isCanonicalDateString(todayString)) return false;
  return event.eventDate >= todayString;
};

const compareDatesAscending = (firstEvent, secondEvent) => {
  return firstEvent.eventDate.localeCompare(secondEvent.eventDate);
};

const compareOldEventsDescending = (firstEvent, secondEvent) => {
  const firstDate = firstEvent?.eventDate;
  const secondDate = secondEvent?.eventDate;
  const isFirstValid = isCanonicalDateString(firstDate);
  const isSecondValid = isCanonicalDateString(secondDate);

  if (isFirstValid && isSecondValid) return secondDate.localeCompare(firstDate);
  if (isFirstValid) return -1;
  if (isSecondValid) return 1;
  return 0;
};

const getDaysInMonth = (year, month) => {
  const daysByMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysByMonth[month - 1];
};

const isLeapYear = (year) => {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
};
