'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
const profileImageElement = document.getElementById("profile-image");
const profileNameElement = document.getElementById("profile-name");
const profileTitleElement = document.getElementById("profile-title");
const profileCvLink = document.getElementById("profile-cv-link");
const profileInfoContent = document.querySelector(".sidebar-info .info-content");
const profileAvatarFigure = profileImageElement?.closest("figure");
const profileContactsList = document.querySelector(".sidebar-info_more .contacts-list");
const profileSocialList = document.querySelector(".sidebar-info_more .social-list");
const profileDetailsSeparators = document.querySelectorAll(".sidebar-info_more > .separator");

const setProfileVisibility = (element, visible) => {
  if (!element) return;
  element.hidden = !visible;
  element.style.display = visible ? "" : "none";
};

const profileContactElements = {
  email: {
    link: document.getElementById("profile-email"),
    item: document.getElementById("profile-email")?.closest(".contact-item"),
  },
  phone: {
    link: document.getElementById("profile-phone"),
    item: document.getElementById("profile-phone")?.closest(".contact-item"),
  },
  location: {
    text: document.getElementById("profile-location"),
    item: document.getElementById("profile-location")?.closest(".contact-item"),
  },
};

const profileSocialElements = {
  github: {
    link: document.getElementById("profile-github"),
    item: document.getElementById("profile-github")?.closest(".social-item"),
  },
  linkedin: {
    link: document.getElementById("profile-linkedin"),
    item: document.getElementById("profile-linkedin")?.closest(".social-item"),
  },
  whatsapp: {
    link: document.getElementById("profile-whatsapp"),
    item: document.getElementById("profile-whatsapp")?.closest(".social-item"),
  },
};

if (profileImageElement) {
  profileImageElement.addEventListener("error", () => {
    setProfileVisibility(profileImageElement, false);
    setProfileVisibility(profileAvatarFigure, false);
  });
}

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

// Projects and certifications prefer the public API and fall back to the legacy JSON files.
let globalProjectsData = [];
let globalCertsData = [];
let globalProjectCategories = [];
let portfolioDataPromise = null;

const requestJsonArray = async (path) => {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Expected an array response.");
  return data;
};

const safeExternalUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const resolvePortfolioImage = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const normalized = value.trim().replace(/\\/g, "/");
  const upload = /^\/?uploads\/(projects|certificates|awards|profile)\/([0-9a-f-]{36})\.(jpg|jpeg|png|webp)$/i.exec(normalized);
  if (upload) return `/uploads/${upload[1]}/${upload[2]}.${upload[3]}`;

  const assetPath = normalized.replace(/^\.\//, "");
  if (/^assets\/[a-zA-Z0-9_./-]+$/.test(assetPath) && !assetPath.split("/").includes("..")) {
    return `./${assetPath}`;
  }
  return "";
};

const resolveProfileCv = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const normalized = value.trim().replace(/\\/g, "/");
  const cv = /^\/?uploads\/cv\/([0-9a-f-]{36})\.pdf$/i.exec(normalized);
  return cv ? `/uploads/cv/${cv[1]}.pdf` : "";
};

const applyApiProfile = (profile) => {
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  if (profileNameElement) {
    profileNameElement.textContent = name;
    if (name) profileNameElement.title = name;
    else profileNameElement.removeAttribute("title");
    setProfileVisibility(profileNameElement, Boolean(name));
  }

  const title = typeof profile.title === "string" ? profile.title.trim() : "";
  if (profileTitleElement) {
    profileTitleElement.textContent = title;
    setProfileVisibility(profileTitleElement, Boolean(title));
  }
  setProfileVisibility(profileInfoContent, Boolean(name || title));
  document.title = name ? (title ? `${name} | ${title}` : name) : "Portfolio";

  const email = typeof profile.email === "string" ? profile.email.trim() : "";
  const emailElements = profileContactElements.email;
  if (emailElements.link) {
    emailElements.link.textContent = email;
    if (email && !/[\r\n]/.test(email)) emailElements.link.href = `mailto:${email}`;
    else emailElements.link.removeAttribute("href");
    setProfileVisibility(emailElements.item, Boolean(email && !/[\r\n]/.test(email)));
  }

  const phone = typeof profile.phone === "string" ? profile.phone.trim() : "";
  const phoneHref = phone.replace(/[\s().-]/g, "");
  const validPhone = phone && /^\+?\d{5,15}$/.test(phoneHref);
  const phoneElements = profileContactElements.phone;
  if (phoneElements.link) {
    phoneElements.link.textContent = validPhone ? phone : "";
    if (validPhone) phoneElements.link.href = `tel:${phoneHref}`;
    else phoneElements.link.removeAttribute("href");
    setProfileVisibility(phoneElements.item, Boolean(validPhone));
  }

  const location = typeof profile.location === "string" ? profile.location.trim() : "";
  const locationElements = profileContactElements.location;
  if (locationElements.text) {
    locationElements.text.textContent = location;
    setProfileVisibility(locationElements.item, Boolean(location));
  }
  const hasContact = Boolean(email && !/[\r\n]/.test(email)) || Boolean(validPhone) || Boolean(location);
  setProfileVisibility(profileContactsList, hasContact);

  const socialValues = {
    github: profile.github_url,
    linkedin: profile.linkedin_url,
    whatsapp: profile.whatsapp_url,
  };
  Object.entries(profileSocialElements).forEach(([key, elements]) => {
    const url = safeExternalUrl(socialValues[key]);
    if (elements.link) {
      if (url) elements.link.href = url;
      else elements.link.removeAttribute("href");
      setProfileVisibility(elements.item, Boolean(url));
    }
  });
  const hasSocial = Object.values(profileSocialElements).some(({ item }) => item && !item.hidden);
  setProfileVisibility(profileSocialList, hasSocial);
  if (profileDetailsSeparators.length > 0) setProfileVisibility(profileDetailsSeparators[0], hasContact || hasSocial);
  if (profileDetailsSeparators.length > 1) setProfileVisibility(profileDetailsSeparators[1], hasContact && hasSocial);

  const image = resolvePortfolioImage(profile.profile_image_path);
  if (profileImageElement) {
    profileImageElement.alt = name;
    if (image) {
      profileImageElement.src = image;
      setProfileVisibility(profileImageElement, true);
      setProfileVisibility(profileAvatarFigure, true);
    } else {
      profileImageElement.removeAttribute("src");
      setProfileVisibility(profileImageElement, false);
      setProfileVisibility(profileAvatarFigure, false);
    }
  }

  const cv = resolveProfileCv(profile.cv_file_path);
  if (profileCvLink) {
    if (cv) {
      profileCvLink.href = cv;
      profileCvLink.download = "CV.pdf";
    } else {
      profileCvLink.removeAttribute("href");
      profileCvLink.removeAttribute("download");
    }
    setProfileVisibility(profileCvLink, Boolean(cv));
  }
};

const loadApiProfile = async () => {
  try {
    const response = await fetch("/api/profile", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
    const profile = await response.json();
    if (profile && typeof profile === "object" && !Array.isArray(profile)) applyApiProfile(profile);
  } catch (error) {
    console.warn("Profile API request failed; profile details remain hidden.", error);
  }
};

const normalizeApiProject = (project) => {
  const categoryName = typeof project.category_name === "string" ? project.category_name.trim() : "";
  const githubUrl = safeExternalUrl(project.github_url);
  const liveUrl = safeExternalUrl(project.live_url);
  return {
    id: String(project.id ?? ""),
    title: typeof project.title === "string" ? project.title : "",
    category: categoryName.toLowerCase(),
    displayCategory: categoryName || "Other",
    categoryId: project.category_id,
    description: typeof project.description === "string" ? project.description : "",
    technologies: Array.isArray(project.technologies) ? project.technologies.filter((item) => typeof item === "string") : [],
    image: resolvePortfolioImage(project.image_path),
    link: liveUrl || githubUrl,
    githubUrl,
    liveUrl,
  };
};

const normalizeLegacyProject = (project) => ({
  ...project,
  category: typeof project.category === "string" ? project.category : "",
  displayCategory: typeof project.displayCategory === "string" ? project.displayCategory : "",
  description: typeof project.description === "string" ? project.description : "",
  technologies: Array.isArray(project.technologies) ? project.technologies.filter((item) => typeof item === "string") : [],
  image: resolvePortfolioImage(project.image),
  link: safeExternalUrl(project.link),
});

const normalizeApiCertification = (certificate) => ({
  id: String(certificate.id ?? ""),
  title: typeof certificate.title === "string" ? certificate.title : "",
  issuer: typeof certificate.issuer === "string" ? certificate.issuer : "",
  date: typeof certificate.issue_date === "string" ? certificate.issue_date : "",
  link: safeExternalUrl(certificate.certificate_url),
  image: resolvePortfolioImage(certificate.image_path),
});

const normalizeLegacyCertification = (certificate) => ({
  ...certificate,
  title: typeof certificate.title === "string" ? certificate.title : "",
  issuer: typeof certificate.issuer === "string" ? certificate.issuer : "",
  date: typeof certificate.date === "string" ? certificate.date : "",
  link: safeExternalUrl(certificate.link),
  image: resolvePortfolioImage(certificate.image),
});

const loadCollectionWithFallback = async (apiPath, jsonPath, normalizeApiRecord, normalizeJsonRecord, label) => {
  try {
    const records = await requestJsonArray(apiPath);
    if (records.length) return { records: records.map(normalizeApiRecord), source: "api" };
    console.warn(`${label} API returned no records; trying the legacy JSON fallback.`);
  } catch (error) {
    console.warn(`${label} API request failed; trying the legacy JSON fallback.`, error);
  }

  try {
    const records = await requestJsonArray(jsonPath);
    return { records: records.map(normalizeJsonRecord), source: "json" };
  } catch (error) {
    console.warn(`${label} API and JSON fallback are unavailable.`, error);
    return { records: [], source: "empty" };
  }
};

const loadApiCategories = async () => {
  try {
    const categories = await requestJsonArray("/api/categories");
    return categories.filter((category) => typeof category.name === "string" && category.name.trim());
  } catch (error) {
    console.warn("Project categories API request failed; deriving filters from the loaded projects.", error);
    return [];
  }
};

const loadPortfolioData = () => {
  if (!portfolioDataPromise) {
    portfolioDataPromise = (async () => {
      const [projects, certifications, categories] = await Promise.all([
        loadCollectionWithFallback("/api/projects", "./assets/data/projects.json", normalizeApiProject, normalizeLegacyProject, "Projects"),
        loadCollectionWithFallback("/api/certifications", "./assets/data/certificates.json", normalizeApiCertification, normalizeLegacyCertification, "Certifications"),
        loadApiCategories(),
      ]);
      globalProjectsData = projects.records;
      globalCertsData = certifications.records;
      globalProjectCategories = projects.source === "api" ? categories : [];
    })();
  }
  return portfolioDataPromise;
};

// Loaded data is cached for the lifetime of the page; filter clicks use the in-memory collection.
const loadUserProjects = () => {
  return globalProjectsData || [];
};

const loadCerts = () => {
  return globalCertsData || [];
};

// Keep built-in defaults empty; public records come from the API or JSON fallback.
const defaultProjects = [];

const getAllProjects = () => [...defaultProjects, ...loadUserProjects()];

const projectListElem = document.getElementById("project-list");

const getProjectCategoryMeta = (projects) => {
  const usedCategoryIds = new Set(projects.map((project) => String(project.categoryId ?? "")));
  const usedCategoryNames = new Set(projects.map((project) => String(project.category || "").trim().toLowerCase()));
  const apiCategories = globalProjectCategories
    .filter((category) => usedCategoryIds.has(String(category.id)) || usedCategoryNames.has(category.name.trim().toLowerCase()))
    .map((category) => ({ value: category.name.trim().toLowerCase(), label: category.name.trim() }));
  if (apiCategories.length) return apiCategories;

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
    const filterButton = document.createElement("button");
    filterButton.dataset.filterBtn = "";
    filterButton.textContent = label;
    filterItem.appendChild(filterButton);
    filterFragment.appendChild(filterItem);

    const selectItem = document.createElement("li");
    selectItem.className = "select-item";
    const selectButton = document.createElement("button");
    selectButton.dataset.selectItem = "";
    selectButton.textContent = label;
    selectItem.appendChild(selectButton);
    selectFragment.appendChild(selectItem);
  });

  filterList.appendChild(filterFragment);
  selectList.appendChild(selectFragment);
};

const renderProjects = () => {
  if (!projectListElem) return;

  projectListElem.innerHTML = "";
  const projects = getAllProjects();

  if (!projects.length) {
    const item = document.createElement("li");
    item.className = "project-item active";
    const message = document.createElement("p");
    message.className = "timeline-text";
    message.textContent = "Projects are temporarily unavailable.";
    item.appendChild(message);
    projectListElem.appendChild(item);
    syncProjectCategoriesUI([]);
    return;
  }

  projects.forEach((p) => {
    const li = document.createElement("li");
    li.className = "project-item active";
    li.setAttribute("data-filter-item", "");
    const categoryKey = (p.category || p.displayCategory || "all").toLowerCase();
    li.dataset.category = categoryKey;
    const displayCategory = p.displayCategory || p.category || "Other";

    const title = escapePortfolioText(p.title);
    const category = escapePortfolioText(displayCategory);
    const description = escapePortfolioText(p.description);
    const technologies = escapePortfolioText((p.technologies || []).join(", "));
    const image = resolvePortfolioImage(p.image);
    const imageMarkup = image ? `<img src="${escapePortfolioText(image)}" alt="${title}" loading="lazy">` : "";
    const imageFigureClass = image ? "project-img" : "project-img project-img-placeholder";
    const projectContent = `
        <figure class="${imageFigureClass}">
          <div class="project-item-icon-box">
            <ion-icon name="eye-outline"></ion-icon>
          </div>
          ${imageMarkup}
        </figure>
        <h3 class="project-title">${title}</h3>
        <p class="project-category">${category}</p>
        ${description ? `<p class="project-description">${description}</p>` : ""}
        ${technologies ? `<p class="project-technologies">${technologies}</p>` : ""}
    `;

    const projectLink = safeExternalUrl(p.link);
    li.innerHTML = projectLink
      ? `<a href="${escapePortfolioText(projectLink)}" target="_blank" rel="noopener noreferrer">${projectContent}</a>`
      : `<div>${projectContent}</div>`;

    projectListElem.appendChild(li);
  });

  const categories = getProjectCategoryMeta(projects);
  syncProjectCategoriesUI(categories);
};

// Preserve the existing certification card markup for API and fallback records.
const certDisplayList = document.getElementById("certifications-list");
const renderCertifications = () => {
  if (!certDisplayList) return;
  const certs = loadCerts();
  certDisplayList.innerHTML = "";
  if (!certs.length) {
    const li = document.createElement("li");
    li.className = "project-item active";
    const message = document.createElement("p");
    message.className = "timeline-text";
    message.textContent = "Certifications are temporarily unavailable.";
    li.appendChild(message);
    certDisplayList.appendChild(li);
    return;
  }
  certs.forEach((certificate) => {
    const li = document.createElement("li");
    li.className = "project-item active";
    const title = escapePortfolioText(certificate.title || "Certification");
    const issuer = escapePortfolioText(certificate.issuer);
    const date = escapePortfolioText(certificate.date);
    const link = safeExternalUrl(certificate.link) || "#";
    const image = resolvePortfolioImage(certificate.image);
    const imageMarkup = image ? `<img src="${escapePortfolioText(image)}" alt="${title}" loading="lazy">` : "";
    li.innerHTML = `
      <a href="${escapePortfolioText(link)}" target="_blank" rel="noopener noreferrer">
        <figure class="project-img${image ? "" : " project-img-placeholder"}">
          <div class="project-item-icon-box"><ion-icon name="ribbon-outline"></ion-icon></div>
          ${imageMarkup}
        </figure>
        <h3 class="project-title">${title}</h3>
        <p class="project-category">${issuer} • ${date}</p>
      </a>`;
    certDisplayList.appendChild(li);
  });
};

const escapePortfolioText = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const educationListElement = document.getElementById("education-list");
const experienceListElement = document.getElementById("experience-list");
const formatTimelineYear = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const date = value.trim();
  const isoDate = /^(\d{4})-\d{2}-\d{2}$/.exec(date);
  return isoDate ? isoDate[1] : date;
};

const renderTimelineMessage = (list, message) => {
  if (!list) return;
  list.replaceChildren();
  const item = document.createElement("li");
  item.className = "timeline-item";
  const text = document.createElement("p");
  text.className = "timeline-text";
  text.textContent = message;
  item.appendChild(text);
  list.appendChild(item);
};

const renderEducationMessage = (message) => renderTimelineMessage(educationListElement, message);

const publicSkillsListElement = document.getElementById("public-skills-list");
const renderPublicSkillsMessage = (message) => {
  if (!publicSkillsListElement) return;
  publicSkillsListElement.replaceChildren();
  const item = document.createElement("li");
  item.className = "skills-item";
  const text = document.createElement("p");
  text.className = "timeline-text";
  text.textContent = message;
  item.appendChild(text);
  publicSkillsListElement.appendChild(item);
};

const renderPublicSkills = (records) => {
  if (!publicSkillsListElement) return;
  publicSkillsListElement.replaceChildren();

  const skillsByCategory = new Map();
  records.forEach((record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return;
    const category = typeof record.category === "string" ? record.category.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!category || !name) return;
    if (!skillsByCategory.has(category)) skillsByCategory.set(category, []);
    skillsByCategory.get(category).push(name);
  });

  if (!skillsByCategory.size) {
    renderPublicSkillsMessage("No skills are available.");
    return;
  }

  skillsByCategory.forEach((names, category) => {
    const item = document.createElement("li");
    item.className = "skills-item";
    const titleWrapper = document.createElement("div");
    titleWrapper.className = "title-wrapper";
    const title = document.createElement("h5");
    title.className = "h5";
    title.textContent = category;
    titleWrapper.appendChild(title);
    const list = document.createElement("p");
    list.className = "timeline-text";
    list.textContent = names.join(", ");
    item.append(titleWrapper, list);
    publicSkillsListElement.appendChild(item);
  });
};

const renderEducation = (records) => {
  if (!educationListElement) return;
  educationListElement.replaceChildren();

  const educationRecords = records.filter((record) => record && typeof record === "object" && !Array.isArray(record));
  if (!educationRecords.length) {
    renderEducationMessage("No education records are available.");
    return;
  }

  educationRecords.forEach((record) => {
    const item = document.createElement("li");
    item.className = "timeline-item";

    const degree = typeof record.degree === "string" ? record.degree.trim() : "";
    if (degree) {
      const title = document.createElement("h4");
      title.className = "h4 timeline-item-title";
      title.textContent = degree;
      item.appendChild(title);
    }

    const startYear = formatTimelineYear(record.start_date);
    const endYear = formatTimelineYear(record.end_date);
    const period = startYear && endYear ? `${startYear} — ${endYear}` : (startYear || endYear);
    if (period) {
      const date = document.createElement("span");
      date.textContent = period;
      item.appendChild(date);
    }

    const institution = typeof record.institution === "string" ? record.institution.trim() : "";
    const description = typeof record.description === "string" ? record.description.trim() : "";
    const details = [institution, description].filter(Boolean).join(" · ");
    if (details) {
      const text = document.createElement("p");
      text.className = "timeline-text";
      text.textContent = details;
      item.appendChild(text);
    }

    educationListElement.appendChild(item);
  });
};

const renderExperience = (records) => {
  if (!experienceListElement) return;
  experienceListElement.replaceChildren();

  const experienceRecords = records.filter((record) => record && typeof record === "object" && !Array.isArray(record));
  if (!experienceRecords.length) {
    renderTimelineMessage(experienceListElement, "No experience records are available.");
    return;
  }

  experienceRecords.forEach((record) => {
    const item = document.createElement("li");
    item.className = "timeline-item";

    const position = typeof record.position === "string" ? record.position.trim() : "";
    const company = typeof record.company === "string" ? record.company.trim() : "";
    const heading = [position, company].filter(Boolean).join(" — ");
    if (heading) {
      const title = document.createElement("h4");
      title.className = "h4 timeline-item-title";
      title.textContent = heading;
      item.appendChild(title);
    }

    const startYear = formatTimelineYear(record.start_date);
    const endYear = formatTimelineYear(record.end_date);
    const period = startYear && endYear ? `${startYear} — ${endYear}` : (startYear || endYear);
    if (period) {
      const date = document.createElement("span");
      date.textContent = period;
      item.appendChild(date);
    }

    const description = typeof record.description === "string" ? record.description.trim() : "";
    if (description) {
      const text = document.createElement("p");
      text.className = "timeline-text";
      text.textContent = description;
      item.appendChild(text);
    }

    experienceListElement.appendChild(item);
  });
};

requestJsonArray("/api/education").then(renderEducation).catch((error) => {
  console.warn("Education API request failed.", error);
  renderEducationMessage("Education is temporarily unavailable.");
});

requestJsonArray("/api/skills").then(renderPublicSkills).catch((error) => {
  console.warn("Skills API request failed.", error);
  renderPublicSkillsMessage("Skills are temporarily unavailable.");
});

requestJsonArray("/api/experience").then(renderExperience).catch((error) => {
  console.warn("Experience API request failed.", error);
  renderTimelineMessage(experienceListElement, "Experience is temporarily unavailable.");
});

// Load the database-backed sidebar profile and portfolio API data on page load.
loadApiProfile();
loadPortfolioData().then(() => {
  renderProjects();
  renderCertifications();
}).catch((error) => {
  console.error("Portfolio data could not be loaded.", error);
  globalProjectsData = [];
  globalCertsData = [];
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
