import { supabase } from './supabase.js'



// =========================
// PASSWORD VISIBILITY
// =========================

function togglePassword(){

  const input =
    document.getElementById("authPassword");

  const icon =
    document.getElementById("loginEyeIcon");


  if(input.type === "password"){

    input.type = "text";

    icon.classList.replace(
      "fa-eye",
      "fa-eye-slash"
    );

  } else {

    input.type = "password";

    icon.classList.replace(
      "fa-eye-slash",
      "fa-eye"
    );

  }

}



function toggleRegisterPassword(){

  const input =
    document.getElementById("registerPassword");

  const icon =
    document.getElementById("registerEyeIcon");


  if(input.type === "password"){

    input.type = "text";

    icon.classList.replace(
      "fa-eye",
      "fa-eye-slash"
    );

  } else {

    input.type = "password";

    icon.classList.replace(
      "fa-eye-slash",
      "fa-eye"
    );

  }

}



// =========================
// REGISTER MODAL
// =========================

function openRegisterModal(){

  document
    .getElementById("registerModal")
    .style.display = "flex";

}


function closeRegisterModal(){

  document
    .getElementById("registerModal")
    .style.display = "none";

}

/* =========================
   MOBILE ABOUT MODAL
========================= */

function openAboutModal(){

  const modal =
    document.getElementById(
      "mobileAboutModal"
    );

  modal.style.display = "flex";

}


function closeAboutModal(){

  const modal =
    document.getElementById(
      "mobileAboutModal"
    );

  modal.style.display = "none";

}

// =========================
// LOGIN
// =========================

async function login(){

  const loginButton =
    document.querySelector(".primary-btn");

  const originalText =
    loginButton.innerHTML;


  const email =
    document
      .getElementById("authEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("authPassword")
      .value;


  if(!email || !password){

    alert("Please enter email and password.");

    return;

  }


  loginButton.disabled = true;

  loginButton.innerHTML =
    `<span class="spinner"></span> Logging in...`;


  try{

    const { data, error } =
      await supabase.auth.signInWithPassword({

        email,
        password

      });


    if(error){

      console.error(error);

      alert(error.message);

      return;

    }


    alert("Login successful!");

    window.location.href = "wallet.html";


  } catch(err){

    console.error(err);

    alert("Unexpected login error.");

  } finally {

    loginButton.disabled = false;

    loginButton.innerHTML = originalText;

  }

}



// =========================
// SIGN UP
// =========================

async function signUp(){

  const registerButton =
    document.querySelector(
      "#registerModal .primary-btn"
    );

  const originalText =
    registerButton.innerHTML;


  const email =
    document
      .getElementById("registerEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("registerPassword")
      .value;


  if(!email || !password){

    alert("Please fill all fields.");

    return;

  }


  if(password.length < 6){

    alert(
      "Password must be at least 6 characters."
    );

    return;

  }


  registerButton.disabled = true;

  registerButton.innerHTML =
    `<span class="spinner"></span> Creating account...`;


  try{

    const { data, error } =
      await supabase.auth.signUp({

        email,
        password

      });


    if(error){

      console.error(error);

      alert(error.message);

      return;

    }


    alert(
      "Account created successfully!"
    );


    closeRegisterModal();


  } catch(err){

    console.error(err);

    alert(
      "Unexpected signup error."
    );

  } finally {

    registerButton.disabled = false;

    registerButton.innerHTML =
      "Create Account";

  }

}



// =========================
// CLOSE MODAL OUTSIDE CLICK
// =========================

window.onclick = function(event){

  const modal =
    document.getElementById("registerModal");


  if(event.target === modal){

    closeRegisterModal();

  }

}



// =========================
// AUTO SESSION REDIRECT
// =========================

const { data: { session } } =
  await supabase.auth.getSession();


if(session){

  window.location.href = "wallet.html";

}



// =========================
// GLOBAL FUNCTIONS
// =========================

window.login = login;

window.signUp = signUp;

window.togglePassword =
  togglePassword;

window.toggleRegisterPassword =
  toggleRegisterPassword;

window.openRegisterModal =
  openRegisterModal;

window.closeRegisterModal =
  closeRegisterModal;

  window.openAboutModal =
  openAboutModal;

window.closeAboutModal =
  closeAboutModal;

window.openAboutModal = function(){

    document.getElementById("aboutModal").style.display = "flex";

}

window.closeAboutModal = function(){

    document.getElementById("aboutModal").style.display = "none";

}