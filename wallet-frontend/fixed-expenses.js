// 1. INITIALIZE GLOBAL CLIENT INSTANCE SPECIFIC TO THIS VIEW
const supabaseClient = window.supabase.createClient(
  "https://ekhbvsbyvatkzkrxpkjr.supabase.co",
  "sb_publishable_fK5ugsmPlD4Ud0zng765_A_XKCQYoEN"
);

let fixedExpenses = [];

let fixedAllocation = 10000;

async function initializePage(){

  await loadFixedExpenses();

  updateSummary();

  renderExpenses();

}

// DYNAMIC UI TOAST NOTIFICATION CONTROLLER
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

// REUSABLE NON-BLOCKING UI CONFIRMATION OVERLAY ENGINE
function showUIConfirm(title, message, isDangerous, onConfirmCallback) {

  document.getElementById("confirmModalTitle").innerText = title;

  document.getElementById("confirmModalMessage").innerText = message;

  const iconBox = document.getElementById("confirmModalIcon");

  const submitBtn = document.getElementById("confirmModalSubmitBtn");


  if (isDangerous) {

    iconBox.style.color = "#ef4444";

    iconBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;

    submitBtn.style.background = "#ef4444";

  } else {

    iconBox.style.color = "#a855f7";

    iconBox.innerHTML = `<i class="fa-solid fa-circle-question"></i>`;

    submitBtn.style.background = "linear-gradient(135deg, #a855f7, #d946ef)";

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

// 2. EXPENSE MODAL CONTROLLERS
function openExpenseModal(){

  document
    .getElementById("expenseModal")
    .style.display = "flex";

}

function closeExpenseModal(){

  document
    .getElementById("expenseModal")
    .style.display = "none";

}

// 3. ALLOCATION MODAL OVERRIDES (NO MORE POPUPS)
function openAllocationModal(){

  document.getElementById("customAllocationInput").value = fixedAllocation;

  document.getElementById("allocationModal").style.display = "flex";

}

function closeAllocationModal(){

  document.getElementById("allocationModal").style.display = "none";

}

function saveAllocationSettings(){

  const allocationInput = document.getElementById("customAllocationInput").value;

  const parsedAmount = Number(allocationInput);

  if (allocationInput.trim() === "" || isNaN(parsedAmount) || parsedAmount < 0) {

    showToast("Please enter a valid numeric budget amount.", "error");

    return;

  }

  fixedAllocation = parsedAmount;

  updateSummary();

  closeAllocationModal();

  showToast("Allocation budget updated successfully.");

}

// 4. RESET SYSTEM PIPELINE
async function resetFixedExpenses(){

  showUIConfirm(

    "Reset Cutoff Cycle?",

    "Are you sure you want to completely RESET all inputs and fixed expenses for this cutoff? This will erase all ledger data from the cloud permanently.",

    true,

    async () => {

      const {
        data: { session }
      } = await supabaseClient.auth.getSession();

      if(!session){

        showToast("Session expired. Please log in again.", "error");

        return;

      }

      const { error } = await supabaseClient
        .from("fixed_expenses")
        .delete()
        .eq("user_id", session.user.id);

      if (error) {

        console.error("Cloud Reset Error:", error);

        showToast("Failed to clear entries from the cloud database.", "error");

        return;

      }

      fixedExpenses = [];

      fixedAllocation = 10000;

      updateSummary();

      renderExpenses();

      showToast("Fixed allocation system successfully reset!");

    }

  );

}

async function saveFixedExpense(){

  const name =
    document.getElementById("expenseName").value.trim();

  const category =
    document.getElementById("expenseCategory").value;

  const amount =
    Number(document.getElementById("expenseAmount").value);

  const date =
    document.getElementById("expenseDate").value;

  if(!name || !amount || !date){

    showToast("Please complete all fields.", "error");

    return;

  }

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if(!session){

    showToast("Session expired.", "error");

    return;

  }

  const newExpense = {

    user_id: session.user.id,

    expense_name: name,

    category: category,

    amount: amount,

    expense_date: date

  };

  const { error } = await supabaseClient
    .from("fixed_expenses")
    .insert([newExpense]);

  if(error){

    console.error(error);

    showToast("Failed to save expense.", "error");

    return;

  }

  await loadFixedExpenses();

  updateSummary();

  renderExpenses();

  closeExpenseModal();

  clearModalFields();

  showToast("Expense record securely saved to cloud.");

}

function clearModalFields(){

  document.getElementById("expenseName").value = "";

  document.getElementById("expenseAmount").value = "";

  document.getElementById("expenseDate").value = "";

}

async function loadFixedExpenses(){

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if(!session) return;

  const { data, error } = await supabaseClient
    .from("fixed_expenses")
    .select("*")
    .eq("user_id", session.user.id)
    .order("expense_date", { ascending:false });

  if(error){

    console.error(error);

    return;

  }

  fixedExpenses = data || [];

}

function updateSummary(){

  const totalSpent =
    fixedExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

  const remaining =
    fixedAllocation - totalSpent;

  document.getElementById(
    "fixedAllocationDisplay"
  ).innerText =
    `₱${fixedAllocation.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  document.getElementById(
    "totalSpentDisplay"
  ).innerText =
    `₱${totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  document.getElementById(
    "remainingDisplay"
  ).innerText =
    `₱${remaining.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

}

function renderExpenses(){

  const tbody =
    document.getElementById("expenseTableBody");

  tbody.innerHTML = "";

  if(fixedExpenses.length === 0){

    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          No fixed expenses yet.
        </td>
      </tr>
    `;

    return;

  }

  fixedExpenses.forEach((expense,index)=>{

    const tr = document.createElement("tr");

    tr.innerHTML = `

      <td>${expense.expense_name}</td>

      <td>${expense.category}</td>

      <td>
        ₱${Number(expense.amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      <td>${expense.expense_date}</td>

      <td>

        <button
          class="delete-btn"
          onclick="deleteExpense(${index})"
        >
          <i class="fa-solid fa-trash"></i>
        </button>

      </td>

    `;

    tbody.appendChild(tr);

  });

}

function deleteExpense(index){

  const expense = fixedExpenses[index];

  showUIConfirm(

    "Delete Expense?",

    `Are you sure you want to permanently remove "${expense.expense_name}" from your records?`,

    true,

    async () => {

      const { error } = await supabaseClient
        .from("fixed_expenses")
        .delete()
        .eq("id", expense.id);

      if(error){

        console.error(error);

        showToast("Failed to delete entry.", "error");

        return;

      }

      fixedExpenses.splice(index, 1);

      updateSummary();

      renderExpenses();

      showToast("Fixed expense record permanently deleted.");

    }

  );

}

// 5. EXPOSE WINDOW DELEGATES TO HANDLE HTML CLICK HANDLERS
window.openExpenseModal = openExpenseModal;

window.closeExpenseModal = closeExpenseModal;

window.saveFixedExpense = saveFixedExpense;

window.deleteExpense = deleteExpense;

window.openAllocationModal = openAllocationModal;

window.closeAllocationModal = closeAllocationModal;

window.saveAllocationSettings = saveAllocationSettings;

window.resetFixedExpenses = resetFixedExpenses;

window.closeConfirmModal = closeConfirmModal;

// KICKSTART CORE ENGINE PIPELINE
initializePage();