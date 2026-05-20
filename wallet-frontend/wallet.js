import { supabase } from './supabase.js'

// 1. INITIALIZATION PIPELINE
async function init() {

  const { data: { session } } =
    await supabase.auth.getSession();

  if(!session){

    window.location.href = "login.html";

    return;

  }

  await loadExpensesFromCloud();

  handleSalaryCycleChange();

  generateCalendarData();

  console.log("Supabase Connected & Authenticated:", supabase);

}

async function logout(){

  await supabase.auth.signOut();

  window.location.href = "login.html";

}

// 2. REMOTE STORAGE MATRIX CALLS (NOW SECURELY SELECTS AND RETOURS THE CREATED ROW TO RE-LINK THE ID IMMEDIATELY)
async function saveExpenseToCloud(expenseData) {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if(!session) return null;

  expenseData.user_id = session.user.id;

  const { data, error } = await supabase
    .from('expenses')
    .insert([expenseData])
    .select();

  if(error) {

    console.error("Cloud Save Error:", error);

    showToast("Failed to secure financial record in cloud.", "error");

    return null;

  } else {

    console.log("Expense saved to cloud:", data);

    return data[0];

  }

}

async function loadExpensesFromCloud() {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if(!session) return;

  const user = session.user;

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id);

  if(error){

    console.error("Cloud Load Error:", error);

    return;

  }

  expenseDatabase = {};

  data.forEach(expense => {

    if(!expenseDatabase[expense.date_key]){

      expenseDatabase[expense.date_key] = [];

    }

    expenseDatabase[expense.date_key].push({

      id: expense.id,

      name: expense.expense_name,

      amount: Number(expense.amount),

      time: expense.expense_time

    });

  });

}

let salaryCycle = "cutoff";

let rolloverMode = "full";

let totalBudgetAmount = 15000;

// Dual Cutoff State Architecture Parameters
let cutoff1Start = 1;

let cutoff1End = 15;

let cutoff1Budget = 10000;


let cutoff2Start = 16;

let cutoff2End = 31;

let cutoff2Budget = 8000;


let currentDate = new Date(); // Tracks currently browsed calendar month view

let selectedDayIndex = null;

let calendarDays = [];

// Central Data Layer: Persistent transactional database maps arrays of logs
let expenseDatabase = {};

// Audit Track Dictionary Database to handle day lockout states keyed by "YYYY-MM-DD"
let noExpenseAuditDatabase = {};


const monthTitle =
  document.getElementById("monthTitle");

const calendarGrid =
  document.getElementById("calendarGrid");

const modalOverlay =
  document.getElementById("modalOverlay");

const modalDate =
  document.getElementById("modalDate");

const modalBudget =
  document.getElementById("modalBudget");

const expenseRows =
  document.getElementById("expenseRows");

const totalSpent =
  document.getElementById("totalSpent");

const balance =
  document.getElementById("balance");

const tomorrowBudget =
  document.getElementById("tomorrowBudget");

const offsetBox =
  document.getElementById("offsetBox");

const budgetDropdown =
  document.getElementById("budgetDropdown");

const themeDropdown =
  document.getElementById("themeDropdown");


// IN-UI TOAST STACK UTILITY CONTROLLER
function showToast(message, type = "success") {

  const container = document.getElementById("toastContainer");

  if (!container) return;

  const toast = document.createElement("div");

  toast.className = `ui-toast ${type === "error" ? "toast-error" : "toast-success"}`;

  const icon = type === "error" 
    ? `<i class="fa-solid fa-circle-exclamation"></i>` 
    : `<i class="fa-solid fa-circle-check"></i>`;

  toast.innerHTML = `${icon} <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {

    toast.style.opacity = "0";

    toast.style.transform = "scale(0.9) translateY(10px)";

    setTimeout(() => {

      toast.remove();

    }, 300);

  }, 4000);

}

// IN-UI BLOCKING CUSTOM ACTION CONFIRMATION MODAL OVERLAY ENGINE
function showUIConfirm(title, message, isDangerous, onConfirmCallback) {

  document.getElementById("confirmModalTitle").innerText = title;

  document.getElementById("confirmModalMessage").innerText = message;

  const iconBox = document.getElementById("confirmModalIcon");

  const submitBtn = document.getElementById("confirmModalSubmitBtn");


  if (isDangerous) {

    iconBox.style.color = "var(--red)";

    iconBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;

    submitBtn.style.background = "var(--red)";

  } else {

    iconBox.style.color = "var(--violet)";

    iconBox.innerHTML = `<i class="fa-solid fa-circle-question"></i>`;

    submitBtn.style.background = "linear-gradient(135deg, var(--violet), var(--pink))";

  }


  const newSubmitBtn = submitBtn.cloneNode(true);

  submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);


  newSubmitBtn.addEventListener("click", () => {

    onConfirmCallback();

    closeConfirmModal();

  });


  document.getElementById("confirmModal").style.display = "flex";

}

function closeConfirmModal() {

  document.getElementById("confirmModal").style.display = "none";

}

// FIAT FORMATTER UTILITY
function formatMoney(amount){

  return Number(amount).toLocaleString("en-PH", {

    minimumFractionDigits:2,

    maximumFractionDigits:2

  });

}


// DATETIME STRING CONVERTER
function formatFullDate(date){

  return date.toLocaleDateString("en-PH", {

    month:"long",

    day:"numeric",

    year:"numeric"

  });

}


// MOBILE AUTOMATIC FOCUS SCROLLER UTILITY
function scrollToCurrentDayOnMobile() {
  if (window.innerWidth <= 600) {
    setTimeout(() => {
      const liveTodayCard = document.querySelector(".live-today-active-focus-card");
      if (liveTodayCard) {
        liveTodayCard.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }, 60);
  }
}


// DYNAMIC RUNTIME FORM SWITCHER
function handleSalaryCycleChange(){

  salaryCycle =
    document.getElementById("salaryCycle").value;

  const cutoffConfigSection =
    document.getElementById("cutoffConfigSection");

  const monthlyConfigSection =
    document.getElementById("monthlyConfigSection");


  if(salaryCycle === "cutoff"){

    cutoffConfigSection.style.display = "block";

    monthlyConfigSection.style.display = "none";

  }
  else {

    cutoffConfigSection.style.display = "none";

    monthlyConfigSection.style.display = "block";

  }

}


// DROPDOWN MANAGERS
function toggleBudgetDropdown(){

  budgetDropdown.classList.toggle("active");

  themeDropdown.classList.remove("active");

}


// TOGGLE THEMES DROPDOWN LAYOUT LAYER
function toggleThemeDropdown(){

  themeDropdown.classList.toggle("active");

  budgetDropdown.classList.remove("active");

}


// APPLY SYSTEM BACKGROUND CLASSES
function changeTheme(themeName, element){

  document.body.className = "";

  document.body.classList.add(themeName);

  document
    .querySelectorAll(".theme-card")
    .forEach(card => {

      card.classList.remove("active-theme");

    });

  element.classList.add("active-theme");

}


// APPLY PROFILE BOUNDARIES
function applyBudgetSettings(){

  salaryCycle =
    document.getElementById("salaryCycle").value;

  rolloverMode =
    document.getElementById("rolloverMode").value;


  // Sync Dual Cutoff Input Fields
  cutoff1Start = Number(document.getElementById("cutoff1Start").value) || 1;

  cutoff1End = Number(document.getElementById("cutoff1End").value) || 15;

  cutoff1Budget = Number(document.getElementById("cutoff1Budget").value) || 0;


  cutoff2Start = Number(document.getElementById("cutoff2Start").value) || 16;

  cutoff2End = Number(document.getElementById("cutoff2End").value) || 31;

  cutoff2Budget = Number(document.getElementById("cutoff2Budget").value) || 0;


  // Sync Monthly Fallback Input Fields
  totalBudgetAmount = Number(document.getElementById("totalBudgetInput").value) || 0;


  generateCalendarData();

  budgetDropdown.classList.remove("active");

  showToast("Cycle parameters dynamically updated.");

}


// CONSOLIDATED SINGLE-PIPELINE COMPILING ENGINE
function generateCalendarData(){

  calendarDays = [];

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  const totalDaysInMonth =
    new Date(year, month + 1, 0).getDate();


  for(let day = 1; day <= totalDaysInMonth; day++){

    const d = new Date(year, month, day);
    
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;


    if(!expenseDatabase[dateKey]){

      expenseDatabase[dateKey] = [];

    }

    if(!noExpenseAuditDatabase[dateKey]){

      noExpenseAuditDatabase[dateKey] = false;

    }


    let totalSpentOnDay = 
      expenseDatabase[dateKey].reduce((sum, current) => sum + current.amount, 0);


    let assignedCutoff = null;

    if(salaryCycle === "cutoff"){

      if(day >= cutoff1Start && day <= cutoff1End){

        assignedCutoff = 1;

      }
      else if(day >= cutoff2Start && day <= cutoff2End){

        assignedCutoff = 2;

      }

    }


    const dayData = {

      date: d,

      dateKey: dateKey,

      dayOfMonth: day,

      budget: 0,

      expenses: expenseDatabase[dateKey],

      totalSpent: totalSpentOnDay,

      balance: 0,

      carryOver: 0,

      cutoffAssignment: assignedCutoff,

      isNoExpenseMarked: noExpenseAuditDatabase[dateKey]

    };


    calendarDays.push(dayData);

  }


  updateCarryOvers();

}


// CASCADE ROLLOVER PIPELINE CALCULATOR ENGINE WITH SEQUENTIAL DEFICIT ABSORPTION
function updateCarryOvers(){

  if (salaryCycle === "monthly") {

    const fixedDailyBudget =
      calendarDays.length > 0
        ? totalBudgetAmount / calendarDays.length
        : 0;

    let carryOver = 0;


    for(let i = 0; i < calendarDays.length; i++){

      const day = calendarDays[i];

      let rawAllocatedBase = 0;


      if(rolloverMode === "full"){

        rawAllocatedBase = fixedDailyBudget;

      }
      else {

        let remainingPool = totalBudgetAmount;

        for (let x = 0; x < i; x++) {

          remainingPool -= calendarDays[x].totalSpent;

        }

        let remainingDays =
          calendarDays.length - i;

        rawAllocatedBase =
          remainingDays > 0
            ? remainingPool / remainingDays
            : 0;

      }


      let unpaidDeficitAmount = 0;


      if (carryOver < 0) {

        let deficitAbsoluteValue = Math.abs(carryOver);

        if (rawAllocatedBase >= deficitAbsoluteValue) {

          day.budget = rawAllocatedBase - deficitAbsoluteValue;

        } else {

          day.budget = 0;

          unpaidDeficitAmount = deficitAbsoluteValue - rawAllocatedBase;

        }

      } else {

        day.budget = (rolloverMode === "full") 

          ? rawAllocatedBase + carryOver 

          : rawAllocatedBase;

      }


      day.carryOver = carryOver;

      day.balance = day.budget - day.totalSpent - unpaidDeficitAmount;

      carryOver = day.balance;

    }

  }
  else {

    // Process Cutoff Period 1
    let c1Days = calendarDays.filter(d => d.cutoffAssignment === 1);

    let c1CarryOver = 0;


    for(let i = 0; i < c1Days.length; i++){

      const day = c1Days[i];

      let rawAllocatedBase = 0;


      const c1FixedDailyBudget =
        c1Days.length > 0
          ? cutoff1Budget / c1Days.length
          : 0;

      if (rolloverMode === "full") {

        rawAllocatedBase = c1FixedDailyBudget;

      }
      else {

        let remainingPool = cutoff1Budget;

        for (let x = 0; x < i; x++) {

          remainingPool -= c1Days[x].totalSpent;

        }

        let remainingDays =
          c1Days.length - i;

        rawAllocatedBase =
          remainingDays > 0
            ? remainingPool / remainingDays
            : 0;

      }


      let unpaidDeficitAmount = 0;


      if (c1CarryOver < 0) {

        let deficitAbsoluteValue = Math.abs(c1CarryOver);

        if (rawAllocatedBase >= deficitAbsoluteValue) {

          day.budget = rawAllocatedBase - deficitAbsoluteValue;

        } else {

          day.budget = 0;

          unpaidDeficitAmount = deficitAbsoluteValue - rawAllocatedBase;

        }

      } else {

        day.budget = (rolloverMode === "full") 

          ? rawAllocatedBase + c1CarryOver 

          : rawAllocatedBase;

      }


      day.carryOver = c1CarryOver;

      day.balance = day.budget - day.totalSpent - unpaidDeficitAmount;

      c1CarryOver = day.balance;

    }


    // Process Cutoff Period 2
    let c2Days = calendarDays.filter(d => d.cutoffAssignment === 2);

    let c2CarryOver = 0;


    for(let i = 0; i < c2Days.length; i++){

      const day = c2Days[i];

      let rawAllocatedBase = 0;


      const c2FixedDailyBudget =
        c2Days.length > 0
          ? cutoff2Budget / c2Days.length
          : 0;

      if (rolloverMode === "full") {

        rawAllocatedBase = c2FixedDailyBudget;

      }
      else {

        let remainingPool = cutoff2Budget;

        for (let x = 0; x < i; x++) {

          remainingPool -= c2Days[x].totalSpent;

        }

        let remainingDays =
          c2Days.length - i;

        rawAllocatedBase =
          remainingDays > 0
            ? remainingPool / remainingDays
            : 0;

      }


      let unpaidDeficitAmount = 0;


      if (c2CarryOver < 0) {

        let deficitAbsoluteValue = Math.abs(c2CarryOver);

        if (rawAllocatedBase >= deficitAbsoluteValue) {

          day.budget = rawAllocatedBase - deficitAbsoluteValue;

        } else {

          day.budget = 0;

          unpaidDeficitAmount = deficitAbsoluteValue - rawAllocatedBase;

        }

      } else {

        day.budget = (rolloverMode === "full") 

          ? rawAllocatedBase + c2CarryOver 

          : rawAllocatedBase;

      }


      day.carryOver = c2CarryOver;

      day.balance = day.budget - day.totalSpent - unpaidDeficitAmount;

      c2CarryOver = day.balance;

    }


    // Handle Buffer/Unassigned days cleanly
    let unassignedDays = calendarDays.filter(d => d.cutoffAssignment === null);

    unassignedDays.forEach(day => {

      day.budget = 0;

      day.carryOver = 0;

      day.balance = 0 - day.totalSpent;

    });

  }


  renderCalendar();

  updateOverview();

}


// METRICS OVERVIEW MONITOR
function updateOverview(){

  const realTimeClockNow = new Date();

  const realDay = realTimeClockNow.getDate();


  let activeAllocatedBudget = 0;

  let realTimeSpentAccumulator = 0;

  let recommendedDailyPacingAmount = 0;

  let remainingDaysCount = 0;


  const lblTotalBudget = document.getElementById("labelTotalBudget");

  const lblRemainingBudget = document.getElementById("labelRemainingBudget");

  const lblDailyBudget = document.getElementById("labelDailyBudget");


  const bannerRealTimeDate = document.getElementById("bannerRealTimeDate");

  const bannerCycleFrame = document.getElementById("bannerCycleFrame");

  const bannerPacing = document.getElementById("bannerPacing");

  const bannerActiveMode = document.getElementById("bannerActiveMode");


  const liveAlertCard = document.getElementById("liveAlertCard");

  const liveAlertIcon = document.getElementById("liveAlertIcon");

  const liveAlertHeadline = document.getElementById("liveAlertHeadline");

  const liveAlertBadge = document.getElementById("liveAlertBadge");

  const liveAlertDescription = document.getElementById("liveAlertDescription");

  const liveAlertInsight = document.getElementById("liveAlertInsight");


  bannerRealTimeDate.innerText = realTimeClockNow.toLocaleDateString("en-PH", {
    month:"short", day:"numeric", year:"numeric"
  }) + ` (Today: Day ${realDay})`;


  if(salaryCycle === "monthly") {

    activeAllocatedBudget = totalBudgetAmount;

    lblTotalBudget.innerText = "Active Monthly Budget";

    lblRemainingBudget.innerText = "Remaining Monthly Balance";

    lblDailyBudget.innerText = "Live Recommended Daily";

    bannerCycleFrame.innerText = "Full Month Window";


    realTimeSpentAccumulator = calendarDays.reduce((sum, d) => sum + d.totalSpent, 0);

    remainingDaysCount = (calendarDays.length - realDay) + 1;

    let todayDataObj = calendarDays.find(d => d.dayOfMonth === realDay);

    recommendedDailyPacingAmount = todayDataObj ? todayDataObj.budget : 0;

    bannerPacing.innerText = `${remainingDaysCount} Days Left This Month`;


    bannerActiveMode.className = "banner-badge mode-monthly";

    bannerActiveMode.innerText = "MONTHLY SYSTEM MONITOR";

  }
  else {

    let targetCutoffScope = null;


    if(realDay >= cutoff1Start && realDay <= cutoff1End) {

      targetCutoffScope = 1;

      bannerCycleFrame.innerText = `1st Cutoff Framework (Days ${cutoff1Start}-${cutoff1End})`;

      bannerActiveMode.className = "banner-badge mode-c1";

      bannerActiveMode.innerText = "ACTIVE ON 1ST CUTOFF RANGE";

    }
    else if(realDay >= cutoff2Start && realDay <= cutoff2End) {

      targetCutoffScope = 2;

      bannerCycleFrame.innerText = `2nd Cutoff Framework (Days ${cutoff2Start}-${cutoff2End})`;

      bannerActiveMode.className = "banner-badge mode-c2";

      bannerActiveMode.innerText = "ACTIVE ON 2ND CUTOFF RANGE";

    }
    else {

      targetCutoffScope = null;

      bannerCycleFrame.innerText = "Out of Core Defined Ranges";

      bannerActiveMode.className = "banner-badge mode-unassigned";

      bannerActiveMode.innerText = "DEAD ZONE DRIFT TRACKER";

    }


    if(targetCutoffScope === 1) {

      activeAllocatedBudget = cutoff1Budget;

      lblTotalBudget.innerText = "1st Cutoff Base Budget";

      lblRemainingBudget.innerText = "Remaining in 1st Cutoff";

      lblDailyBudget.innerText = "Recommended 1st Cutoff Daily";


      let filteredC1Days = calendarDays.filter(d => d.cutoffAssignment === 1);

      realTimeSpentAccumulator = filteredC1Days.reduce((sum, d) => sum + d.totalSpent, 0);

      remainingDaysCount = Math.max(0, (cutoff1End - realDay) + 1);

      let todayDataObj = calendarDays.find(d => d.dayOfMonth === realDay);

      recommendedDailyPacingAmount = todayDataObj ? todayDataObj.budget : 0;

      bannerPacing.innerText = `${remainingDaysCount} Active Days Remaining in C1`;

    }
    else if(targetCutoffScope === 2) {

      activeAllocatedBudget = cutoff2Budget;

      lblTotalBudget.innerText = "2nd Cutoff Base Budget";

      lblRemainingBudget.innerText = "Remaining in 2nd Cutoff";

      lblDailyBudget.innerText = "Recommended 2nd Cutoff Daily";


      let filteredC2Days = calendarDays.filter(d => d.cutoffAssignment === 2);

      realTimeSpentAccumulator = filteredC2Days.reduce((sum, d) => sum + d.totalSpent, 0);

      remainingDaysCount = Math.max(0, (cutoff2End - realDay) + 1);

      let todayDataObj = calendarDays.find(d => d.dayOfMonth === realDay);

      recommendedDailyPacingAmount = todayDataObj ? todayDataObj.budget : 0;

      bannerPacing.innerText = `${remainingDaysCount} Active Days Remaining in C2`;

    }
    else {

      activeAllocatedBudget = 0;

      realTimeSpentAccumulator = calendarDays.reduce((sum, d) => sum + d.totalSpent, 0);

      lblTotalBudget.innerText = "Unallocated Buffer Range";

      lblRemainingBudget.innerText = "Total Out of Pocket Month Burn";

      lblDailyBudget.innerText = "Recommended Buffer Allowance";

      recommendedDailyPacingAmount = 0;

      remainingDaysCount = 0;

      bannerPacing.innerText = "System Outside Operational Windows";

    }

  }


  const dynamicRemaining = activeAllocatedBudget - realTimeSpentAccumulator;


  document.getElementById("overviewTotalBudget").innerText = 
    `₱${formatMoney(activeAllocatedBudget)}`;

  document.getElementById("overviewRemainingBudget").innerText = 
    `₱${formatMoney(dynamicRemaining)}`;

  document.getElementById("overviewDailyBudget").innerText = 
    `₱${formatMoney(recommendedDailyPacingAmount)}`;


  const runtimeUsedPercentage = 
    activeAllocatedBudget > 0 ? (realTimeSpentAccumulator / activeAllocatedBudget) * 100 : 0;


  document.getElementById("progressFill").style.width = 
    `${Math.min(runtimeUsedPercentage, 100)}%`;

  document.getElementById("progressText").innerText = 
    `${runtimeUsedPercentage.toFixed(1)}% Bound Used`;


  let todayFrameData = calendarDays.find(d => d.dayOfMonth === realDay);

  if (todayFrameData) {

    let dailyLimit = todayFrameData.budget;

    let dailySpent = todayFrameData.totalSpent;


    if (dailySpent > dailyLimit) {

      let overageAmount = dailySpent - dailyLimit;

      liveAlertCard.className = "alert-system-card tracking-overspend-state";

      liveAlertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

      liveAlertHeadline.innerText = `Warning: Overspending Detected! You are ₱${formatMoney(overageAmount)} Over Today's Budget`;

      liveAlertBadge.innerText = "OVER BUDGET";

      liveAlertDescription.innerText = `Your spending on this frame has exceeded today's dynamically calculated threshold of ₱${formatMoney(dailyLimit)}.`;

      liveAlertInsight.innerText = `Smart Insight: You must reduce spending tomorrow. Remaining days inside this cycle have tightened to absorb this deficit footprint.`;

    }
    else if (dailyLimit > 0 && dailySpent >= (dailyLimit * 0.85)) {

      let marginAmount = dailyLimit - dailySpent;

      liveAlertCard.className = "alert-system-card tracking-near-limit-state";

      liveAlertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

      liveAlertHeadline.innerText = `Caution: Nearing Spending Limit. Only ₱${formatMoney(marginAmount)} Available Before Deficit`;

      liveAlertBadge.innerText = "NEAR LIMIT";

      liveAlertDescription.innerText = `You have utilized ${((dailySpent / dailyLimit) * 100).toFixed(0)}% of your dynamic daily allocation framework.`;

      liveAlertInsight.innerText = `Smart Insight: Pacing yourself right now safeguards your current rollover trajectories for the remaining cycle.`;

    }
    else {

      liveAlertCard.className = "alert-system-card tracking-safe-state";

      liveAlertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

      liveAlertHeadline.innerText = "Discipline Tracker: Within Allocated Limits";

      liveAlertBadge.innerText = "LIVE STATE";

      liveAlertDescription.innerText = `Your dynamic expenditure profile for today is currently well paced within sustainable boundaries.`;

      liveAlertInsight.innerText = `Smart Insight: Keeping a low tracking spend velocity expands tomorrow's rollover potential.`;

    }

  }


  if(dynamicRemaining < 0) {

    document.getElementById("overviewRemainingBudget").style.color = "var(--red)";

  }
  else {

    document.getElementById("overviewRemainingBudget").style.color = "";

  }

}


// CALENDAR VIEW BUILDER RENDERER UTILITY
function renderCalendar(){

  calendarGrid.innerHTML = "";

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  const firstDayOffset =
    new Date(year, month, 1).getDay();


  const realTimeNow = new Date();

  const isCurrentLiveMonth = (realTimeNow.getFullYear() === year && realTimeNow.getMonth() === month);

  const realTodayDayNumber = realTimeNow.getDate();


  monthTitle.innerText =
    currentDate.toLocaleDateString("en-PH", {

      month:"long",

      year:"numeric"

    });


  for(let i = 0; i < firstDayOffset; i++){

    const emptyCell =
      document.createElement("div");

    emptyCell.classList.add(
      "calendar-day",
      "empty"
    );

    calendarGrid.appendChild(emptyCell);

  }


  const weekdayLongNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


  for(let i = 0; i < calendarDays.length; i++){

    const day =
      calendarDays[i];

    const card =
      document.createElement("div");

    card.classList.add("calendar-day");


    const currentCardWeekday = weekdayLongNames[day.date.getDay()];


    if(day.cutoffAssignment === 1){

      card.classList.add("cutoff-one-card-edge");

    }
    else if(day.cutoffAssignment === 2){

      card.classList.add("cutoff-two-card-edge");

    }


    if(isCurrentLiveMonth && day.dayOfMonth === realTodayDayNumber){

      card.classList.add("live-today-active-focus-card");

    }

    if(day.isNoExpenseMarked) {

      card.classList.add("lockout-audited-zero-card");

    }


    let dayBalanceStateClass = "green-bg";

    if (day.totalSpent > day.budget) {

      dayBalanceStateClass = "red-bg-critical-overflow";

    }
    else if (day.budget > 0 && day.totalSpent >= (day.budget * 0.85)) {

      dayBalanceStateClass = "yellow-bg-near-limit";

    }
    else if (day.balance < 0) {

      dayBalanceStateClass = "red-bg";

    }


    card.innerHTML = `

      <div class="day-number-row">
        <div class="day-title-container">
          <span class="day-number">${i + 1}</span>
          <span class="day-card-inline-weekday">${currentCardWeekday}</span>
        </div>
        <div class="day-badges-stack">
          ${isCurrentLiveMonth && day.dayOfMonth === realTodayDayNumber ? `<span class="today-tag-pill-badge">TODAY</span>` : ''}
          ${day.isNoExpenseMarked ? `<span class="no-expense-badge">Ø SPEND</span>` : ''}
          ${day.cutoffAssignment ? `<span class="cutoff-pill">C${day.cutoffAssignment}</span>` : ''}
        </div>
      </div>

      <div class="day-row-info">
        <span class="day-label">Alloc</span>
        <span class="day-value-budget">₱${formatMoney(day.budget)}</span>
      </div>

      <div class="day-row-info">
        <span class="day-label">Spent</span>
        <span class="day-value-spent">₱${formatMoney(day.totalSpent)}</span>
      </div>

      <div class="day-row-info day-row-rollover">
        <span class="day-label">Roll</span>
        <span class="day-value-rollover">₱${formatMoney(day.carryOver)}</span>
      </div>

      <div class="day-balance ${dayBalanceStateClass}">
        ₱${formatMoney(day.balance)}
      </div>

    `;


    card.addEventListener("click", function(){

      openDayModal(i);

    });


    calendarGrid.appendChild(card);

  }


  scrollToCurrentDayOnMobile();

}


// LEDGER TRANSACTION INTERFACES
function openDayModal(index){

  selectedDayIndex = index;

  renderModalData();

  modalOverlay.classList.add("active");

}


function closeModal(){

  modalOverlay.classList.remove("active");

  selectedDayIndex = null;

}


// CHRONOLOGICAL TIMELINE NAVIGATION HANDLER WITHIN ACTIVE MODAL SURFACE
function navigateDayTimeline(directionOffset) {

  if (selectedDayIndex === null) return;


  let targetIndex = selectedDayIndex + directionOffset;


  if (targetIndex >= 0 && targetIndex < calendarDays.length) {

    selectedDayIndex = targetIndex;

    renderModalData();

  }

}


// APPEND ENTRY DATA LOG MUTATOR (IMMEDIATELY APPLIES SAVED RESPONSES AND LOCKS CORRESPONDING IDS)
async function addExpense(){

  if(selectedDayIndex === null){

    return;

  }


  const nameInput = document.getElementById("expenseName");

  const amountInput = document.getElementById("expenseAmount");


  const name = nameInput.value.trim();

  const amount = Number(amountInput.value);


  if(name === "" || amount <= 0){

    showToast("Complete fields with valid transactional targets.", "error");

    return;

  }


  const day =
    calendarDays[selectedDayIndex];


  if(day.isNoExpenseMarked) {

    showToast("Unlock 'No Expenses Today' verification state before appending ledger metrics.", "error");

    return;

  }


  const time =
    new Date().toLocaleTimeString("en-PH", {

      hour:"numeric",

      minute:"2-digit"

    });


  const savedRow = await saveExpenseToCloud({

    date_key: day.dateKey,

    expense_name: name,

    amount: amount,

    expense_time: time

  });


  if (!savedRow) {

    return;

  }

  // Pure state push architecture prevents tracking gaps from ever building up
  const newLocalItem = {

    id: savedRow.id,

    name: savedRow.expense_name,

    amount: Number(savedRow.amount),

    time: savedRow.expense_time

  };


  day.expenses.push(newLocalItem);

  expenseDatabase[day.dateKey] = day.expenses;

  day.totalSpent += amount;


  updateCarryOvers();

  renderModalData();


  nameInput.value = "";

  amountInput.value = "";

  showToast("Expense record securely saved to cloud.");

}


// FIXED DELETION ENGINE (NOW SEAMLESSLY ACCEPTS EXPLICIT ID STRINGS ROUTED STRAIGHT OUT OF THE TEMPLATE METER)
function deleteExpenseById(dbRecordRowId, localArrayItemIndex) {

  if(selectedDayIndex === null) return;

  const day = calendarDays[selectedDayIndex];


  showUIConfirm(

    "Delete Expense?",

    `Are you sure you want to permanently delete this expense record? This will be erased from the database cloud.`,

    true,

    async () => {

      if (dbRecordRowId && dbRecordRowId !== 'undefined') {

        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", dbRecordRowId);

        if (error) {

          console.error("Cloud Delete Mutation Error:", error);

          showToast("Failed to clear ledger line from database cloud.", "error");

          return;

        }

      } else {

        // Highly strategic fallback tracing parameters cleanup route
        const targetExpenseItem = day.expenses[localArrayItemIndex];

        if (!targetExpenseItem) return;

        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("date_key", day.dateKey)
          .eq("expense_name", targetExpenseItem.name)
          .eq("amount", targetExpenseItem.amount);

        if (error) {

          console.error("Cloud Fallback Delete Mutation Error:", error);

          showToast("Failed fallback trace parameters cleanup.", "error");

          return;

        }

      }

      // Splice directly via targeted array index properties immediately inside confirmation sequence bounds
      const removedItem = day.expenses.splice(localArrayItemIndex, 1)[0];

      expenseDatabase[day.dateKey] = day.expenses;

      day.totalSpent = Math.max(0, day.totalSpent - removedItem.amount);


      updateCarryOvers();

      renderModalData();

      showToast("Expense record successfully removed from database cloud.");

    }

  );

}


// AUDIT TRACK LOCKOUT HANDLER ("NO EXPENSE TODAY")
function toggleNoExpenseStatus() {

  if(selectedDayIndex === null) return;


  const noExpenseCheckbox = document.getElementById("noExpenseCheckbox");

  const day = calendarDays[selectedDayIndex];


  if(noExpenseCheckbox.checked) {

    if(day.expenses.length > 0) {

      showToast("Clear existing transactional records from history table before validating zero balance states.", "error");

      noExpenseCheckbox.checked = false;

      return;

    }


    day.isNoExpenseMarked = true;

    noExpenseAuditDatabase[day.dateKey] = true;

  }
  else {

    day.isNoExpenseMarked = false;

    noExpenseAuditDatabase[day.dateKey] = false;

  }


  updateCarryOvers();

  renderModalData();

}


// MATRIX SUMMARY POPUP INTERFACES RENDERER
function renderModalData(){

  if(selectedDayIndex === null) return;


  const day =
    calendarDays[selectedDayIndex];

  const nextDay = 
    calendarDays[selectedDayIndex + 1];


  const realTimeNow = new Date();

  const isTodayDateNode = (realTimeNow.getFullYear() === currentDate.getFullYear() && 

                           realTimeNow.getMonth() === currentDate.getMonth() && 

                           realTimeNow.getDate() === day.dayOfMonth);


  const modalContextMarkerBadge = document.getElementById("modalContextMarkerBadge");

  if(isTodayDateNode) {

    modalContextMarkerBadge.innerText = "CURRENT REAL-TIME TRACKING TARGET";

    modalContextMarkerBadge.className = "context-marker-badge active-live-marker-badge";

  } 
  else {

    modalContextMarkerBadge.innerText = "HISTORICAL ANALYSIS EDIT ENGINE";

    modalContextMarkerBadge.className = "context-marker-badge";

  }


  modalDate.innerText =
    formatFullDate(day.date);

  modalBudget.innerText =
    `Allocated Budget Frame: ₱${formatMoney(day.budget)}`;


  const noExpenseCheckbox = document.getElementById("noExpenseCheckbox");

  const modalInputFormRow = document.getElementById("modalInputFormRow");


  noExpenseCheckbox.checked = day.isNoExpenseMarked;


  if(day.isNoExpenseMarked) {

    modalInputFormRow.style.opacity = "0.3";

    modalInputFormRow.style.pointerEvents = "none";

  }
  else {

    modalInputFormRow.style.opacity = "1";

    modalInputFormRow.style.pointerEvents = "auto";

  }


  expenseRows.innerHTML = "";


  if(day.expenses.length === 0) {

    const emptyRowElement = document.createElement("div");

    emptyRowElement.className = "expense-row";

    emptyRowElement.style.justifyContent = "center";

    emptyRowElement.style.color = "var(--muted)";

    emptyRowElement.style.fontSize = "14px";

    emptyRowElement.innerText = day.isNoExpenseMarked 

      ? "Verified Lockout State: Explicitly Audited with Ø Spend Balance."

      : "No financial logs submitted for this operational slot.";

    expenseRows.appendChild(emptyRowElement);

  }
  else {

    day.expenses.forEach((expense, index) => {

      const row =
        document.createElement("div");

      row.classList.add("expense-row");

      // BIND UNIQUE STRINGS DIRECTLY ON THE ELEMENT ATTRIBUTES TO SAFEGUARD PERSISTENT ROUTING PIPELINES
      row.innerHTML = `

        <div>

          <div class="expense-description">
            ${expense.name}
          </div>

          <div class="expense-time">
            ${expense.time}
          </div>

        </div>

        <div class="expense-actions-fiat-cell">

          <span class="expense-cost">
            ₱${formatMoney(expense.amount)}
          </span>

          <button class="inline-row-delete-btn" onclick="deleteExpenseById('${expense.id}', ${index})">
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 3.8H2.33333M2.33333 3.8H13M2.33333 3.8V13.6C2.33333 13.9713 2.47381 14.3274 2.72386 14.5899C2.97391 14.8525 3.31304 15 3.66667 15H10.3333C10.687 15 11.0261 14.8525 11.2761 14.5899C11.5262 14.3274 11.6667 13.9713 11.6667 13.6V3.8M4.33333 3.8V2.4C4.33333 2.0287 4.47381 1.6726 4.72386 1.41005C4.97391 1.1475 5.31304 1 5.66667 1H8.33333C8.68696 1 9.02609 1.1475 9.27614 1.41005C9.52619 1.6726 9.66667 2.0287 9.66667 2.4V3.8M5.66667 7.3V11.5M8.33333 7.3V11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

        </div>

      `;


      expenseRows.appendChild(row);

    });

  }


  totalSpent.innerText =
    `₱${formatMoney(day.totalSpent)}`;

  balance.innerText =
    `₱${formatMoney(day.balance)}`;


  if(nextDay && nextDay.cutoffAssignment === day.cutoffAssignment){

    tomorrowBudget.innerText = 
      `₱${formatMoney(nextDay.budget)}`;

  } 
  else {

    tomorrowBudget.innerText = 
      "N/A (End of Cycle Scope)";

  }


  if(day.balance >= 0){

    balance.className = "green";

    offsetBox.className =
      "offset-box green-bg";

  }
  else {

    balance.className =
      "red";

    offsetBox.className =
      "offset-box red-bg";

  }


  offsetBox.innerText =
    `OFFSET CLOSURE: ₱${formatMoney(day.balance)}`;

}


// MONTH NAVIGATION OVERRIDES
function previousMonth(){

  currentDate.setMonth(

    currentDate.getMonth() - 1

  );

  generateCalendarData();

}


function nextMonth(){

  currentDate.setMonth(

    currentDate.getMonth() + 1

  );

  generateCalendarData();

}


// GLOBAL EVENT WINDOW DELEGATES
window.addEventListener("click", function(event){

  if(

    !event.target.closest(".dropdown-container")

  ){

    budgetDropdown.classList.remove("active");

    themeDropdown.classList.remove("active");

  }

});


modalOverlay.addEventListener("click", function(event){

  if(event.target === modalOverlay){

    closeModal();

  }

});


// EXPOSE MODULE FUNCTIONS IMMEDIATELY BEFORE INITIALIZING AUTHENTICATION
window.addExpense = addExpense;
window.deleteExpenseById = deleteExpenseById;
window.toggleNoExpenseStatus = toggleNoExpenseStatus;
window.closeModal = closeModal;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.toggleBudgetDropdown = toggleBudgetDropdown;
window.toggleThemeDropdown = toggleThemeDropdown;
window.applyBudgetSettings = applyBudgetSettings;
window.handleSalaryCycleChange = handleSalaryCycleChange;
window.changeTheme = changeTheme;
window.navigateDayTimeline = navigateDayTimeline;
window.closeConfirmModal = closeConfirmModal;
window.logout = logout;

// FIRE INITIALIZER
init();