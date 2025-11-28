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

// Global data storage (loaded from JSON files)
let globalProjectsData = [];
let globalCertsData = [];
let dataLoaded = false;

// Load data from JSON files (for all users)
const loadDataFromJSON = async () => {
  if (dataLoaded) return; // Only load once
  
  try {
    // Load projects
    const projectsResponse = await fetch('./assets/data/projects.json');
    if (projectsResponse.ok) {
      globalProjectsData = await projectsResponse.json();
    } else {
      console.warn("Failed to load projects.json, using empty array");
      globalProjectsData = [];
    }
  } catch (e) {
    console.error("Error loading projects.json:", e);
    globalProjectsData = [];
  }

  try {
    // Load certificates
    const certsResponse = await fetch('./assets/data/certificates.json');
    if (certsResponse.ok) {
      globalCertsData = await certsResponse.json();
    } else {
      console.warn("Failed to load certificates.json, using empty array");
      globalCertsData = [];
    }
  } catch (e) {
    console.error("Error loading certificates.json:", e);
    globalCertsData = [];
  }
  
  dataLoaded = true;
};

// Save data to JSON file (admin only, using File System Access API)
const saveDataToJSONFile = async (data, filename) => {
  if (!isAdminAuthed) {
    console.error("Only admin can save data to JSON files");
    return false;
  }

  try {
    // Check if File System Access API is available
    if (!('showDirectoryPicker' in window)) {
      console.warn("File System Access API not available. Data saved to localStorage only.");
      return false;
    }

    // If we don't have directory handle yet, request it
    if (!projectDirectoryHandle) {
      const hasAccess = await requestProjectDirectory();
      if (!hasAccess) {
        console.warn("Directory access denied. Data saved to localStorage only.");
        return false;
      }
    }

    // Navigate to assets/data directory
    const assetsHandle = await projectDirectoryHandle.getDirectoryHandle('assets', { create: true });
    const dataHandle = await assetsHandle.getDirectoryHandle('data', { create: true });
    
    // Create/update JSON file
    const fileHandle = await dataHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    
    console.log(`✓ Data saved to assets/data/${filename}`);
    return true;
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
    return false;
  }
};

// Load projects (from JSON files - visible to all users)
const loadUserProjects = () => {
  return globalProjectsData || [];
};

// Save projects (admin only - saves to both localStorage and JSON file)
const saveUserProjects = async (projects) => {
  // Update global data
  globalProjectsData = projects;
  
  // Save to localStorage for immediate preview
  try {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to save projects to localStorage", e);
  }
  
  // Save to JSON file (admin only)
  if (isAdminAuthed) {
    await saveDataToJSONFile(projects, 'projects.json');
  }
};

// Load certificates (from JSON files - visible to all users)
const loadCerts = () => {
  return globalCertsData || [];
};

// Save certificates (admin only - saves to both localStorage and JSON file)
const saveCerts = async (certs) => {
  // Update global data
  globalCertsData = certs;
  
  // Save to localStorage for immediate preview
  try {
    localStorage.setItem(STORAGE_KEYS.certs, JSON.stringify(certs));
  } catch (e) {
    console.error("Failed to save certificates to localStorage", e);
  }
  
  // Save to JSON file (admin only)
  if (isAdminAuthed) {
    await saveDataToJSONFile(certs, 'certificates.json');
  }
};

// default projects (empty so everything comes from Admin)
const defaultProjects = [];

const getAllProjects = () => [...defaultProjects, ...loadUserProjects()];

const projectListElem = document.getElementById("project-list");

const getProjectCategoryMeta = (projects) => {
  const categoryMap = new Map();
  projects.forEach((project) => {
    const label = (project.displayCategory || project.category || "").trim();
    if (!label) return;
    const key = (project.category || label).toLowerCase();
    if (!categoryMap.has(key)) {
      categoryMap.set(key, label);
    }
  });
  return Array.from(categoryMap.entries()).map(([value, label]) => ({
    value,
    label
  }));
};

const syncProjectCategoriesUI = (categories = []) => {
  const filterList = document.querySelector(".filter-list");
  const selectList = document.querySelector(".select-list");
  if (!filterList || !selectList) return;

  // ensure only "All" remains in filter tabs
  const existingFilterBtns = Array.from(
    filterList.querySelectorAll("[data-filter-btn]")
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

  if (!categories.length) return;

  const filterFragment = document.createDocumentFragment();
  const selectFragment = document.createDocumentFragment();

  categories.forEach(({ value, label }) => {
    const filterItem = document.createElement("li");
    filterItem.className = "filter-item";
    filterItem.innerHTML = `<button data-filter-btn>${label}</button>`;
    filterFragment.appendChild(filterItem);

    const selectItem = document.createElement("li");
    selectItem.className = "select-item";
    selectItem.innerHTML = `<button data-select-item>${label}</button>`;
    selectFragment.appendChild(selectItem);
  });

  filterList.appendChild(filterFragment);
  selectList.appendChild(selectFragment);
};

const renderProjects = () => {
  if (!projectListElem) return;

  projectListElem.innerHTML = "";
  const projects = getAllProjects();

  projects.forEach((p) => {
    const li = document.createElement("li");
    li.className = "project-item active";
    li.setAttribute("data-filter-item", "");
    const categoryKey = (p.category || p.displayCategory || "all").toLowerCase();
    li.dataset.category = categoryKey;
    const displayCategory = p.displayCategory || p.category || "Other";

    li.innerHTML = `
      <a href="${p.link || "#"}" target="_blank">
        <figure class="project-img">
          <div class="project-item-icon-box">
            <ion-icon name="eye-outline"></ion-icon>
          </div>
          <img src="${p.image}" alt="${p.title}" loading="lazy">
        </figure>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-category">${displayCategory}</p>
      </a>
    `;

    projectListElem.appendChild(li);
  });

  const categories = getProjectCategoryMeta(projects);
  syncProjectCategoriesUI(categories);
};

// Load data and render on page load
loadDataFromJSON().then(() => {
  renderProjects();
  renderCertifications();
});

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
// Encrypted admin password: "Fri***" obfuscated with a simple XOR key
const ADMIN_PASSWORD_ENC = [87, 67, 88, 85, 80, 72]; // result of each charCode ^ ADMIN_KEY
const ADMIN_KEY = 17;
const getAdminPassword = () =>
  ADMIN_PASSWORD_ENC.map((code) => String.fromCharCode(code ^ ADMIN_KEY)).join("");
let isAdminAuthed = localStorage.getItem("mc_admin_ok") === "1";

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    const clickedLabel = this.innerHTML.toLowerCase();

    // Protect admin page - only accessible if authenticated
    if (clickedLabel === "admin" && !isAdminAuthed) {
      // If trying to access admin without auth, show login section
      if (adminOpenBtn) {
        adminOpenBtn.click();
      }
      return; // Don't navigate to admin page
    }

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
  
  // Hide admin button in sidebar if not authenticated (optional - you can remove this if you want the button always visible)
  // The button will still require authentication to access admin content
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

// Ensure admin page is not visible on load if not authenticated
if (!isAdminAuthed) {
  const adminPage = document.querySelector('[data-page="admin"]');
  if (adminPage) {
    adminPage.classList.remove("active");
  }
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", function () {
    isAdminAuthed = false;
    localStorage.removeItem("mc_admin_ok");
    updateAdminView();
    // Navigate away from admin page after logout
    const adminPage = document.querySelector('[data-page="admin"]');
    if (adminPage && adminPage.classList.contains("active")) {
      // Navigate to about page
      const aboutPage = document.querySelector('[data-page="about"]');
      if (aboutPage) {
        adminPage.classList.remove("active");
        aboutPage.classList.add("active");
      }
    }
  });
}

if (adminOpenBtn) {
  adminOpenBtn.addEventListener("click", function () {
    // Only allow access if authenticated
    if (!isAdminAuthed) {
      // Show login section if not authenticated
      pages.forEach((page) => {
        if (page.dataset.page === "admin") {
          page.classList.add("active");
        } else {
          page.classList.remove("active");
        }
      });
      navigationLinks.forEach((link) => link.classList.remove("active"));
      window.scrollTo(0, 0);
      return;
    }
    
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

const initProjectCategorySelectOptions = () => {
  if (!projectCategorySelect) return;
  const existingValues = new Set(
    Array.from(projectCategorySelect.options).map((opt) => opt.value)
  );
  BASE_CATEGORIES.forEach((category) => {
    if (existingValues.has(category)) return;
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    projectCategorySelect.appendChild(option);
  });
};
initProjectCategorySelectOptions();
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
  projectAdminForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(projectAdminForm);
    const title = (formData.get("title") || "").toString().trim();
    const categoryRaw = (formData.get("category") || "").toString().trim();
    const categoryOther = (formData.get("categoryOther") || "")
      .toString()
      .trim();
    const fileInput = projectAdminForm.querySelector('input[name="image"]');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    let link = (formData.get("link") || "").toString().trim();

    // determine display category (predefined or custom)
    let categoryInput = categoryRaw;
    if (categoryRaw === "__other") {
      categoryInput = categoryOther;
    }

    if (!title || !categoryInput || !file || !link) {
      alert("Please fill in all fields including the image file.");
      return;
    }

    // normalize link so google.com becomes https://google.com
    if (!/^https?:\/\//i.test(link)) {
      link = "https://" + link;
    }

    // Generate a safe filename from the project title
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const fileExtension = file.name.split('.').pop();
    const imageFileName = `project-${safeTitle}.${fileExtension}`;

    // Save the file automatically to assets/projects/ directory
    let imagePath;
    try {
      imagePath = await saveFileToDirectory(file, "projects", imageFileName);
    } catch (error) {
      console.error("Error saving project image:", error);
      alert(`Failed to save project image: ${error.message}\n\nPlease try again and make sure to grant directory access when prompted.`);
      return; // Stop form submission if file save fails
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
          image: imagePath,
          link: link
        };
      }
    } else {
      const newProject = {
        id: createId(),
        title: title,
        category: categoryLower,
        displayCategory: categoryInput,
        image: imagePath,
        link: link,
        isDefault: false
      };
      current.push(newProject);
    }
    const jsonSaved = await saveUserProjects(current);

    projectAdminForm.reset();
    editingProjectId = null;
    const submitSpan = projectAdminForm.querySelector(".form-btn span");
    if (submitSpan) submitSpan.textContent = "Add Project";
    toggleProjectOtherCategory();
    renderProjects();
    filterFunc("all");
    renderAdminProjects();
    
    // Show success message
    if (jsonSaved) {
      alert("✓ Project saved successfully!\n\nNext steps:\n1. Open GitHub Desktop\n2. Commit the files (assets/data/projects.json and assets/projects/)\n3. Push to GitHub\n\nAll users will see this project after you push!");
    } else {
      alert("✓ Project saved to localStorage!\n\nNote: JSON file could not be saved automatically. Please commit and push manually.");
    }
  });
}

if (projectAdminList) {
  projectAdminList.addEventListener("click", async function (e) {
    const removeBtn = e.target.closest("[data-remove-project]");
    const editBtn = e.target.closest("[data-edit-project]");

    if (removeBtn) {
      const id = removeBtn.getAttribute("data-remove-project");
      let current = loadUserProjects();
      current = current.filter((p) => p.id !== id);
      await saveUserProjects(current);

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
      // Note: imageInput is now a file input, so we can't set its value
      // The image path is stored in project.image and will be used when displaying
      if (linkInput) linkInput.value = project.link;

      editingProjectId = id;
      const submitSpan = projectAdminForm.querySelector(".form-btn span");
      if (submitSpan) submitSpan.textContent = "Update Project";
    }
  });
}

renderAdminProjects();

if (projectCategoryList) {
  projectCategoryList.addEventListener("click", async function (e) {
    const removeCatBtn = e.target.closest("[data-remove-category]");
    if (!removeCatBtn) return;

    const catName = removeCatBtn.getAttribute("data-remove-category");
    let current = loadUserProjects();
    current = current.filter((p) => p.displayCategory !== catName);
    await saveUserProjects(current);

    renderProjects();
    filterFunc("all");
    renderAdminProjects();
  });
}

// ---- CERTIFICATION ADMIN ----
// loadCerts and saveCerts are now defined above in the data loading section

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

// Store the directory handle for File System Access API
let projectDirectoryHandle = null;

// Hardcoded project path
const PROJECT_ROOT_PATH = "C:\\Users\\milind\\Documents\\GitHub\\PortFolio";

// Function to request directory access automatically (called when needed)
const requestProjectDirectory = async () => {
  try {
    if ('showDirectoryPicker' in window) {
      // Automatically request directory access - no confirm dialog
      // Browser will remember permission after first time
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      projectDirectoryHandle = handle;
      
      // Mark that permission has been granted
      localStorage.setItem('mc_directory_permission_granted', '1');
      
      // Verify access works by checking assets folder
      try {
        await handle.getDirectoryHandle('assets', { create: true });
        console.log('✓ Directory access granted - files will save automatically!');
      } catch (e) {
        console.warn('Could not verify directory access:', e);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error requesting directory:', error);
      localStorage.removeItem('mc_directory_permission_granted');
    }
    return false;
  }
};

// Function to save file to specific subdirectory (projects or certificates)
const saveFileToDirectory = async (file, subdirectory, fileName) => {
  // Check if File System Access API is available
  if (!('showDirectoryPicker' in window)) {
    alert('File System Access API is not supported in this browser. Please use Chrome or Edge.');
    throw new Error('File System Access API not supported');
  }

  try {
    // If we don't have directory handle yet, request it automatically
    if (!projectDirectoryHandle) {
      const hasAccess = await requestProjectDirectory();
      if (!hasAccess) {
        throw new Error('Directory access was cancelled or denied. Please grant access to save files automatically.');
      }
    }
    
    // Navigate to assets/{subdirectory} directory and save file
    const assetsHandle = await projectDirectoryHandle.getDirectoryHandle('assets', { create: true });
    const targetHandle = await assetsHandle.getDirectoryHandle(subdirectory, { create: true });
    
    // Create file in the directory
    const fileHandle = await targetHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    
    console.log(`✓ File saved: assets/${subdirectory}/${fileName}`);
    return `./assets/${subdirectory}/${fileName}`;
  } catch (error) {
    console.error('Error saving file:', error);
    // If directory handle is invalid, clear it and try once more
    if (error.name === 'NotFoundError' || error.message.includes('invalid')) {
      projectDirectoryHandle = null;
      localStorage.removeItem('mc_directory_permission_granted');
      
      // Try one more time
      const hasAccess = await requestProjectDirectory();
      if (hasAccess) {
        const assetsHandle = await projectDirectoryHandle.getDirectoryHandle('assets', { create: true });
        const targetHandle = await assetsHandle.getDirectoryHandle(subdirectory, { create: true });
        const fileHandle = await targetHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        return `./assets/${subdirectory}/${fileName}`;
      }
    }
    
    alert(`Error saving file: ${error.message}\n\nPlease make sure you select the project directory when prompted.`);
    throw error;
  }
};

// Removed download fallback - files must be saved directly using File System Access API

const renderCertifications = () => {
  const certs = loadCerts();

  if (certDisplayList) {
    certDisplayList.innerHTML = "";

    if (!certs.length) {
      const li = document.createElement("li");
      li.className = "project-item active";
      li.innerHTML = `<p class="timeline-text" style="text-align: center; padding: 20px;">Add your certifications from the Admin panel to see them here.</p>`;
      certDisplayList.appendChild(li);
    } else {
      certs.forEach((c) => {
        const li = document.createElement("li");
        li.className = "project-item active";
        
        // Create image placeholder if no image
        const imageSrc = c.image || "./assets/images/icon-learning.svg";
        const imageAlt = c.title || "Certification";
        
        li.innerHTML = `
          <a href="${c.link || "#"}" target="_blank">
            <figure class="project-img">
              <div class="project-item-icon-box">
                <ion-icon name="ribbon-outline"></ion-icon>
              </div>
              <img src="${imageSrc}" alt="${imageAlt}" loading="lazy">
            </figure>
            <h3 class="project-title">${c.title}</h3>
            <p class="project-category">${c.issuer} • ${c.date}</p>
          </a>
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

    let imagePath = null;
    if (file) {
      try {
        // Generate a safe filename from the certification title
        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const fileExtension = file.name.split('.').pop();
        const imageFileName = `cert-${safeTitle}.${fileExtension}`;
        
        // Save the file automatically to assets/certificates/ directory
        imagePath = await saveFileToDirectory(file, "certificates", imageFileName);
      } catch (error) {
        console.error("Error saving certificate image:", error);
        alert(`Failed to save certificate image: ${error.message}\n\nPlease try again and make sure to grant directory access when prompted.`);
        return; // Stop form submission if file save fails
      }
    } else {
      imagePath = editingCertImage || null;
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
          image: imagePath
        };
      }
    } else {
      certs.push({
        id: createId(),
        title,
        issuer,
        date,
        link,
        image: imagePath
      });
    }

    const jsonSaved = await saveCerts(certs);
    certAdminForm.reset();
    editingCertId = null;
    editingCertImage = null;
    const span = certAdminForm.querySelector(".form-btn span");
    if (span) span.textContent = "Add Certification";
    renderCertifications();
    
    // Show success message
    if (jsonSaved) {
      alert("✓ Certification saved successfully!\n\nNext steps:\n1. Open GitHub Desktop\n2. Commit the files (assets/data/certificates.json and assets/certificates/)\n3. Push to GitHub\n\nAll users will see this certification after you push!");
    } else {
      alert("✓ Certification saved to localStorage!\n\nNote: JSON file could not be saved automatically. Please commit and push manually.");
    }
  });
}

if (certAdminList) {
  certAdminList.addEventListener("click", async function (e) {
    const removeBtn = e.target.closest("[data-remove-cert]");
    const editBtn = e.target.closest("[data-edit-cert]");

    if (removeBtn) {
      const id = removeBtn.getAttribute("data-remove-cert");
      let certs = loadCerts();
      certs = certs.filter((c) => c.id !== id);
      await saveCerts(certs);
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