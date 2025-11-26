'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// ===== PORTFOLIO DATA & RENDERING =====

const STORAGE_KEYS = {
  projects: "mc_portfolio_projects",
  certs: "mc_portfolio_certs"
};

// default projects (empty so everything comes from Admin)
const defaultProjects = [];

const loadUserProjects = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.projects);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load projects from localStorage", e);
    return [];
  }
};

const saveUserProjects = (projects) => {
  try {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to save projects to localStorage", e);
  }
};

const getAllProjects = () => [...defaultProjects, ...loadUserProjects()];

const projectListElem = document.getElementById("project-list");

const syncProjectCategoriesUI = () => {
  const filterList = document.querySelector(".filter-list");
  const selectList = document.querySelector(".select-list");
  if (!filterList || !selectList) return;

  // ensure only "All" remains in filter tabs
  const existingFilterBtns = Array.from(
    filterList.querySelectorAll("[data-filter-btn]")
  );
  const existingFilterKeys = new Set(
    existingFilterBtns.map((btn) => btn.innerText.trim().toLowerCase())
  );

  existingFilterBtns.forEach((btn) => {
    const key = btn.innerText.trim().toLowerCase();
    if (key !== "all") {
      const li = btn.closest(".filter-item");
      if (li) li.remove();
    }
  });

  // ensure only "All" remains in dropdown
  const existingSelectBtns = Array.from(
    selectList.querySelectorAll("[data-select-item]")
  );

  existingSelectBtns.forEach((btn) => {
    const key = btn.innerText.trim().toLowerCase();
    if (key !== "all") {
      const li = btn.closest(".select-item");
      if (li) li.remove();
    }
  });
};

const renderProjects = () => {
  if (!projectListElem) return;

  projectListElem.innerHTML = "";
  const projects = getAllProjects();

  projects.forEach((p) => {
    const li = document.createElement("li");
    li.className = "project-item active";
    li.setAttribute("data-filter-item", "");
    li.dataset.category = p.category.toLowerCase();

    li.innerHTML = `
      <a href="${p.link || "#"}" target="_blank">
        <figure class="project-img">
          <div class="project-item-icon-box">
            <ion-icon name="eye-outline"></ion-icon>
          </div>
          <img src="${p.image}" alt="${p.title}" loading="lazy">
        </figure>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-category">${p.displayCategory}</p>
      </a>
    `;

    projectListElem.appendChild(li);
  });

  syncProjectCategoriesUI();
};

renderProjects();

// custom select & filter variables
const select = document.querySelector("[data-select]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterListElem = document.querySelector(".filter-list");
const selectListElem = document.querySelector(".select-list");

if (select) {
select.addEventListener("click", function () { elementToggleFunc(this); });
}

// filter variables
let filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  filterItems = document.querySelectorAll("[data-filter-item]");

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// handle clicks in dropdown list (event delegation)
if (selectListElem) {
  selectListElem.addEventListener("click", function (e) {
    const itemBtn = e.target.closest("[data-select-item]");
    if (!itemBtn) return;

    const selectedValue = itemBtn.innerText.toLowerCase();
    if (selectValue) {
      selectValue.innerText = itemBtn.innerText;
    }
    if (select) {
      elementToggleFunc(select);
    }
    filterFunc(selectedValue);
  });
}

// handle clicks in filter buttons (event delegation)
let lastClickedBtn = filterListElem
  ? filterListElem.querySelector("[data-filter-btn].active")
  : null;

if (filterListElem) {
  filterListElem.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-filter-btn]");
    if (!btn) return;

    const selectedValue = btn.innerText.toLowerCase();
    if (selectValue) {
      selectValue.innerText = btn.innerText;
    }

    filterFunc(selectedValue);

    if (lastClickedBtn && lastClickedBtn !== btn) {
    lastClickedBtn.classList.remove("active");
    }
    btn.classList.add("active");
    lastClickedBtn = btn;
  });
}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form && formBtn) {
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
      }
    }

  });
}

// handle contact form submission
if (form) {
  // Set the redirect URL to come back to the same page with success parameter
  const formNextUrl = document.getElementById("form-next-url");
  if (formNextUrl) {
    const currentUrl = window.location.href.split("?")[0];
    formNextUrl.value = currentUrl + "?contact=success";
  }
  
  // Check if we're returning from a successful submission
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("contact") === "success") {
    const successMsg = document.getElementById("form-success-message");
    if (successMsg) {
      successMsg.style.display = "block";
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  
  form.addEventListener("submit", function (e) {
    const successMsg = document.getElementById("form-success-message");
    const errorMsg = document.getElementById("form-error-message");
    
    // Hide any previous messages
    if (successMsg) successMsg.style.display = "none";
    if (errorMsg) errorMsg.style.display = "none";
    
    // Show loading state
    if (formBtn) {
      formBtn.disabled = true;
      const span = formBtn.querySelector("span");
      if (span) span.textContent = "Sending...";
    }
    
    // FormSubmit will handle the actual submission and redirect
    // The form will submit normally to FormSubmit
  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");
// Encrypted admin password: "FRIDAY" obfuscated with a simple XOR key
const ADMIN_PASSWORD_ENC = [87, 67, 88, 85, 80, 72]; // result of each charCode ^ ADMIN_KEY
const ADMIN_KEY = 17;
const getAdminPassword = () =>
  ADMIN_PASSWORD_ENC.map((code) => String.fromCharCode(code ^ ADMIN_KEY)).join("");
let isAdminAuthed = localStorage.getItem("mc_admin_ok") === "1";

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    const clickedLabel = this.innerHTML.toLowerCase();

    // toggle articles
    pages.forEach((page) => {
      if (page.dataset.page === clickedLabel) {
        page.classList.add("active");
      } else {
        page.classList.remove("active");
      }
    });

    // toggle navbar active state
    navigationLinks.forEach((link) => {
      if (link === this) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    window.scrollTo(0, 0);

  });
}



// ===== ADMIN PANEL LOGIC =====

// helper to generate simple ids
const createId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// admin login gate
const adminLoginSection = document.getElementById("admin-login-section");
const adminContent = document.getElementById("admin-content");
const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginError = document.getElementById("admin-login-error");
const adminLogoutBtn = document.getElementById("admin-logout-btn");
const adminOpenBtn = document.getElementById("admin-open-btn");

const updateAdminView = () => {
  if (!adminLoginSection || !adminContent) return;

  if (isAdminAuthed) {
    adminLoginSection.style.display = "none";
    adminContent.style.display = "block";
  } else {
    adminLoginSection.style.display = "block";
    adminContent.style.display = "none";
  }

  if (adminLoginError) {
    adminLoginError.style.display = "none";
  }
};

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(adminLoginForm);
    const pwd = (formData.get("password") || "").toString();

    if (pwd === getAdminPassword()) {
      isAdminAuthed = true;
      localStorage.setItem("mc_admin_ok", "1");
      updateAdminView();
      adminLoginForm.reset();
    } else if (adminLoginError) {
      adminLoginError.style.display = "block";
    }
  });
}

updateAdminView();

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", function () {
    isAdminAuthed = false;
    localStorage.removeItem("mc_admin_ok");
    updateAdminView();
  });
}

if (adminOpenBtn) {
  adminOpenBtn.addEventListener("click", function () {
    pages.forEach((page) => {
      if (page.dataset.page === "admin") {
        page.classList.add("active");
      } else {
        page.classList.remove("active");
      }
    });

    navigationLinks.forEach((link) => link.classList.remove("active"));
    window.scrollTo(0, 0);
  });
}

// ---- PROJECT ADMIN ----
const projectAdminForm = document.getElementById("project-admin-form");
const projectAdminList = document.getElementById("project-admin-list");
let editingProjectId = null;
const projectCategoryList = document.getElementById("project-category-list");
const BASE_CATEGORIES = [
  "Data Science",
  "Machine Learning",
  "AI / Deep Learning",
  "Data Visualization",
  "Python Projects",
  "Analytics & BI"
];

const projectCategorySelect = projectAdminForm
  ? projectAdminForm.querySelector('select[name="category"]')
  : null;
const projectCategoryOtherWrapper = document.getElementById(
  "project-category-other-wrapper"
);
const toggleProjectOtherCategory = () => {
  if (!projectCategorySelect || !projectCategoryOtherWrapper) return;
  if (projectCategorySelect.value === "__other") {
    projectCategoryOtherWrapper.style.display = "block";
  } else {
    projectCategoryOtherWrapper.style.display = "none";
    const otherInput = projectCategoryOtherWrapper.querySelector(
      'input[name="categoryOther"]'
    );
    if (otherInput) otherInput.value = "";
  }
};

if (projectCategorySelect) {
  projectCategorySelect.addEventListener("change", toggleProjectOtherCategory);
}

const renderAdminProjects = () => {
  if (!projectAdminList) return;

  const userProjects = loadUserProjects();
  projectAdminList.innerHTML = "";

  if (!userProjects.length) {
    const li = document.createElement("li");
    li.className = "skills-item";
    li.innerHTML = "<p class=\"timeline-text\">No admin-added projects yet.</p>";
    projectAdminList.appendChild(li);
  } else {
    userProjects.forEach((p) => {
      const li = document.createElement("li");
      li.className = "skills-item";
      li.innerHTML = `
        <div class="title-wrapper">
          <h5 class="h5">${p.title}</h5>
          <data>${p.displayCategory} • ${p.category}</data>
        </div>
        <div class="skill-progress-bg">
          <div class="skill-progress-fill" style="width: 100%;"></div>
        </div>
        <button type="button" data-edit-project="${p.id}" class="form-btn" style="margin-top:10px;">
          <ion-icon name="create-outline"></ion-icon>
          <span>Edit</span>
        </button>
        <button type="button" data-remove-project="${p.id}" class="form-btn" style="margin-top:10px;">
          <ion-icon name="trash-outline"></ion-icon>
          <span>Remove</span>
        </button>
      `;
      projectAdminList.appendChild(li);
    });
  }

  renderAdminProjectCategories();
};

const renderAdminProjectCategories = () => {
  if (!projectCategoryList) return;

  const userProjects = loadUserProjects();
  const customCategories = Array.from(
    new Set(
      userProjects
        .map((p) => p.displayCategory)
        .filter(
          (name) =>
            name &&
            !BASE_CATEGORIES.includes(name) &&
            name.toLowerCase() !== "all"
        )
    )
  );

  projectCategoryList.innerHTML = "";

  if (!customCategories.length) {
    const li = document.createElement("li");
    li.className = "skills-item";
    li.innerHTML =
      '<p class="timeline-text">No custom categories yet. Add a project with "Other (custom)" to create one.</p>';
    projectCategoryList.appendChild(li);
    return;
  }

  customCategories.forEach((cat) => {
    const li = document.createElement("li");
    li.className = "skills-item";
    li.innerHTML = `
      <div class="title-wrapper">
        <h5 class="h5">${cat}</h5>
      </div>
      <div class="skill-progress-bg">
        <div class="skill-progress-fill" style="width: 100%;"></div>
      </div>
      <button type="button" data-remove-category="${cat}" class="form-btn" style="margin-top:10px;">
        <ion-icon name="trash-outline"></ion-icon>
        <span>Delete Category & Projects</span>
      </button>
    `;
    projectCategoryList.appendChild(li);
  });
};

if (projectAdminForm) {
  projectAdminForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(projectAdminForm);
    const title = (formData.get("title") || "").toString().trim();
    const categoryRaw = (formData.get("category") || "").toString().trim();
    const categoryOther = (formData.get("categoryOther") || "")
      .toString()
      .trim();
    const image = (formData.get("image") || "").toString().trim();
    let link = (formData.get("link") || "").toString().trim();

    // determine display category (predefined or custom)
    let categoryInput = categoryRaw;
    if (categoryRaw === "__other") {
      categoryInput = categoryOther;
    }

    if (!title || !categoryInput || !image || !link) return;

    // normalize link so google.com becomes https://google.com
    if (!/^https?:\/\//i.test(link)) {
      link = "https://" + link;
    }

    const categoryLower = categoryInput.toLowerCase();

    const current = loadUserProjects();

    if (editingProjectId) {
      const idx = current.findIndex((p) => p.id === editingProjectId);
      if (idx !== -1) {
        current[idx] = {
          ...current[idx],
          title: title,
          category: categoryLower,
          displayCategory: categoryInput,
          image: image,
          link: link
        };
      }
    } else {
      const newProject = {
        id: createId(),
        title: title,
        category: categoryLower,
        displayCategory: categoryInput,
        image: image,
        link: link,
        isDefault: false
      };
      current.push(newProject);
    }
    saveUserProjects(current);

    projectAdminForm.reset();
    editingProjectId = null;
    const submitSpan = projectAdminForm.querySelector(".form-btn span");
    if (submitSpan) submitSpan.textContent = "Add Project";
    toggleProjectOtherCategory();
    renderProjects();
    filterFunc("all");
    renderAdminProjects();
  });
}

if (projectAdminList) {
  projectAdminList.addEventListener("click", function (e) {
    const removeBtn = e.target.closest("[data-remove-project]");
    const editBtn = e.target.closest("[data-edit-project]");

    if (removeBtn) {
      const id = removeBtn.getAttribute("data-remove-project");
      let current = loadUserProjects();
      current = current.filter((p) => p.id !== id);
      saveUserProjects(current);

      renderProjects();
      filterFunc("all");
      renderAdminProjects();
      return;
    }

    if (editBtn && projectAdminForm) {
      const id = editBtn.getAttribute("data-edit-project");
      const current = loadUserProjects();
      const project = current.find((p) => p.id === id);
      if (!project) return;

      const titleInput = projectAdminForm.querySelector('input[name="title"]');
      const categoryInput = projectAdminForm.querySelector('select[name="category"]');
      const imageInput = projectAdminForm.querySelector('input[name="image"]');
      const linkInput = projectAdminForm.querySelector('input[name="link"]');

      if (titleInput) titleInput.value = project.title;
      if (categoryInput) {
        const optionsValues = Array.from(categoryInput.options).map(
          (o) => o.value
        );
        if (optionsValues.includes(project.displayCategory)) {
          categoryInput.value = project.displayCategory;
        } else {
          categoryInput.value = "__other";
          if (projectCategoryOtherWrapper) {
            projectCategoryOtherWrapper.style.display = "block";
            const otherInput =
              projectCategoryOtherWrapper.querySelector(
                'input[name="categoryOther"]'
              );
            if (otherInput) otherInput.value = project.displayCategory;
          }
        }
      }
      if (imageInput) imageInput.value = project.image;
      if (linkInput) linkInput.value = project.link;

      editingProjectId = id;
      const submitSpan = projectAdminForm.querySelector(".form-btn span");
      if (submitSpan) submitSpan.textContent = "Update Project";
    }
  });
}

renderAdminProjects();

if (projectCategoryList) {
  projectCategoryList.addEventListener("click", function (e) {
    const removeCatBtn = e.target.closest("[data-remove-category]");
    if (!removeCatBtn) return;

    const catName = removeCatBtn.getAttribute("data-remove-category");
    let current = loadUserProjects();
    current = current.filter((p) => p.displayCategory !== catName);
    saveUserProjects(current);

    renderProjects();
    filterFunc("all");
    renderAdminProjects();
  });
}

// ---- CERTIFICATION ADMIN ----
const loadCerts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.certs);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load certifications from localStorage", e);
    return [];
  }
};

const saveCerts = (certs) => {
  try {
    localStorage.setItem(STORAGE_KEYS.certs, JSON.stringify(certs));
  } catch (e) {
    console.error("Failed to save certifications to localStorage", e);
  }
};

const certAdminForm = document.getElementById("cert-admin-form");
const certAdminList = document.getElementById("cert-admin-list");
const certDisplayList = document.getElementById("certifications-list");
let editingCertId = null;
let editingCertImage = null;

const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const renderCertifications = () => {
  const certs = loadCerts();

  if (certDisplayList) {
    certDisplayList.innerHTML = "";

    if (!certs.length) {
      const li = document.createElement("li");
      li.className = "timeline-item";
      li.innerHTML = `<p class="timeline-text">Add your certifications from the Admin panel to see them here.</p>`;
      certDisplayList.appendChild(li);
    } else {
      certs.forEach((c) => {
        const li = document.createElement("li");
        li.className = "timeline-item";
        li.innerHTML = `
          <h4 class="h4 timeline-item-title">${c.title}</h4>
          <span>${c.date}</span>
          <p class="timeline-text">
            ${c.issuer} <br>
            <a href="${c.link}" target="_blank" class="contact-link">View Certificate</a>
          </p>
          ${c.image ? `<img src="${c.image}" alt="${c.title}" class="cert-image">` : ""}
        `;
        certDisplayList.appendChild(li);
      });
    }
  }

  if (certAdminList) {
    certAdminList.innerHTML = "";

    if (!certs.length) {
      const li = document.createElement("li");
      li.className = "skills-item";
      li.innerHTML = "<p class=\"timeline-text\">No certifications added yet.</p>";
      certAdminList.appendChild(li);
    } else {
      certs.forEach((c) => {
        const li = document.createElement("li");
        li.className = "skills-item";
        li.innerHTML = `
          <div class="title-wrapper">
            <h5 class="h5">${c.title}</h5>
            <data>${c.issuer} • ${c.date}</data>
          </div>
          <div class="skill-progress-bg">
            <div class="skill-progress-fill" style="width: 100%;"></div>
          </div>
          <button type="button" data-edit-cert="${c.id}" class="form-btn" style="margin-top:10px;">
            <ion-icon name="create-outline"></ion-icon>
            <span>Edit</span>
          </button>
          <button type="button" data-remove-cert="${c.id}" class="form-btn" style="margin-top:10px;">
            <ion-icon name="trash-outline"></ion-icon>
            <span>Remove</span>
          </button>
        `;
        certAdminList.appendChild(li);
      });
    }
  }
};

if (certAdminForm) {
  certAdminForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(certAdminForm);
    const title = (formData.get("title") || "").toString().trim();
    const issuer = (formData.get("issuer") || "").toString().trim();
    const date = (formData.get("date") || "").toString().trim();
    let link = (formData.get("link") || "").toString().trim();
    const fileInput = certAdminForm.querySelector('input[name="image"]');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!title || !issuer || !date || !link) return;

    if (!/^https?:\/\//i.test(link)) {
      link = "https://" + link;
    }

    const certs = loadCerts();

    let imageData = editingCertImage || null;
    if (file) {
      try {
        imageData = await readFileAsDataURL(file);
      } catch {
        imageData = editingCertImage || null;
      }
    }

    if (editingCertId) {
      const idx = certs.findIndex((c) => c.id === editingCertId);
      if (idx !== -1) {
        certs[idx] = {
          ...certs[idx],
          title,
          issuer,
          date,
          link,
          image: imageData
        };
      }
    } else {
      certs.push({
        id: createId(),
        title,
        issuer,
        date,
        link,
        image: imageData
      });
    }

    saveCerts(certs);
    certAdminForm.reset();
    editingCertId = null;
    editingCertImage = null;
    const span = certAdminForm.querySelector(".form-btn span");
    if (span) span.textContent = "Add Certification";
    renderCertifications();
  });
}

if (certAdminList) {
  certAdminList.addEventListener("click", function (e) {
    const removeBtn = e.target.closest("[data-remove-cert]");
    const editBtn = e.target.closest("[data-edit-cert]");

    if (removeBtn) {
      const id = removeBtn.getAttribute("data-remove-cert");
      let certs = loadCerts();
      certs = certs.filter((c) => c.id !== id);
      saveCerts(certs);
      renderCertifications();
      return;
    }

    if (editBtn && certAdminForm) {
      const id = editBtn.getAttribute("data-edit-cert");
      const certs = loadCerts();
      const cert = certs.find((c) => c.id === id);
      if (!cert) return;

      const titleInput = certAdminForm.querySelector('input[name="title"]');
      const issuerInput = certAdminForm.querySelector('input[name="issuer"]');
      const dateInput = certAdminForm.querySelector('input[name="date"]');
      const linkInput = certAdminForm.querySelector('input[name="link"]');
      const fileInput = certAdminForm.querySelector('input[name="image"]');

      if (titleInput) titleInput.value = cert.title;
      if (issuerInput) issuerInput.value = cert.issuer;
      if (dateInput) dateInput.value = cert.date;
      if (linkInput) linkInput.value = cert.link;
      if (fileInput) fileInput.value = "";

      editingCertId = id;
      editingCertImage = cert.image || null;
      const span = certAdminForm.querySelector(".form-btn span");
      if (span) span.textContent = "Update Certification";
    }
  });
}

renderCertifications();