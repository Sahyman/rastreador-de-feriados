import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração oficial do projeto nuvem2-sahmuel
const firebaseConfig = {
  apiKey: "AIzaSyDjD089Ez8dOnodlznju6pwfItUcQ9FakU",
  authDomain: "nuvem2-sahmuel.firebaseapp.com",
  projectId: "nuvem2-sahmuel",
  storageBucket: "nuvem2-sahmuel.firebasestorage.app",
  messagingSenderId: "630216152913",
  appId: "1:630216152913:web:98e2e64c0790c6c1136570"
};

// Inicializa o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventsCollection = collection(db, "lembretes");

// Elementos da DOM
const form = document.getElementById("crud-form");
const eventIdInput = document.getElementById("event-id");
const eventTitleInput = document.getElementById("event-title");
const eventDateInput = document.getElementById("event-date");
const eventCategoryInput = document.getElementById("event-category");
const btnSave = document.getElementById("btn-save");
const btnCancel = document.getElementById("btn-cancel");
const firestoreList = document.getElementById("firestore-list");

const btnFetchApi = document.getElementById("btn-fetch-api");
const apiCountry = document.getElementById("api-country");
const apiYear = document.getElementById("api-year");
const apiResults = document.getElementById("api-results");

// ==========================================
// 1. API Nager.Date - Consumo de Feriados
// ==========================================
async function fetchPublicHolidays() {
  const country = apiCountry.value;
  const year = apiYear.value;

  apiResults.innerHTML = "<p>Carregando feriados...</p>";

  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
    if (!response.ok) throw new Error("Erro ao consultar a API do Nager.Date");

    const holidays = await response.json();
    apiResults.innerHTML = "";

    if (holidays.length === 0) {
      apiResults.innerHTML = "<p>Nenhum feriado encontrado para o período selecionado.</p>";
      return;
    }

    holidays.forEach(holiday => {
      const card = document.createElement("div");
      card.className = "api-card";
      card.innerHTML = `
        <strong>${holiday.localName} (${holiday.name})</strong>
        <span>📅 ${holiday.date}</span>
      `;
      apiResults.appendChild(card);
    });
  } catch (error) {
    apiResults.innerHTML = `<p style="color: #e74c3c;">Falha ao carregar feriados: ${error.message}</p>`;
  }
}

btnFetchApi.addEventListener("click", fetchPublicHolidays);

// ==========================================
// 2. FIRESTORE CRUD (Coleção: lembretes)
// ==========================================

// R (Read) - Escuta a coleção em tempo real e lista os itens dinamicamente
function subscribeToEvents() {
  onSnapshot(eventsCollection, (snapshot) => {
    firestoreList.innerHTML = "";
    
    if (snapshot.empty) {
      firestoreList.innerHTML = "<li>Nenhum lembrete registrado no momento.</li>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const li = document.createElement("li");
      li.className = "item-card";
      li.innerHTML = `
        <div class="item-info">
          <strong>${data.titulo}</strong> <span class="tag">${data.categoria}</span>
          <div>📅 ${data.data}</div>
        </div>
        <div class="actions">
          <button class="btn btn-edit" data-id="${id}" data-titulo="${data.titulo}" data-data="${data.data}" data-categoria="${data.categoria}">Editar</button>
          <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>
      `;
      firestoreList.appendChild(li);
    });

    attachListEvents();
  });
}

// C (Create) e U (Update) - Cadastrar ou Atualizar registros
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = eventIdInput.value;
  const titulo = eventTitleInput.value;
  const data = eventDateInput.value;
  const categoria = eventCategoryInput.value;

  try {
    if (id) {
      // U - Atualizar documento existente
      const docRef = doc(db, "lembretes", id);
      await updateDoc(docRef, { titulo, data, categoria });
    } else {
      // C - Criar novo documento
      await addDoc(eventsCollection, { titulo, data, categoria });
    }
    resetForm();
  } catch (error) {
    console.error("Erro ao salvar no Firestore: ", error);
    alert("Erro ao salvar o registro no banco de dados.");
  }
});

// Manipulação dos botões de Editar e Excluir dinamicamente
function attachListEvents() {
  // Configurar botões de Edição
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const ds = e.target.dataset;
      eventIdInput.value = ds.id;
      eventTitleInput.value = ds.titulo;
      eventDateInput.value = ds.data;
      eventCategoryInput.value = ds.categoria;

      btnSave.textContent = "Atualizar Registro";
      btnCancel.style.display = "inline-block";
    });
  });

  // D (Delete) - Excluir documento
  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("Deseja realmente remover este registro?")) {
        try {
          await deleteDoc(doc(db, "lembretes", id));
        } catch (error) {
          console.error("Erro ao remover no Firestore: ", error);
          alert("Erro ao excluir o registro.");
        }
      }
    });
  });
}

// Cancelar modo de edição
btnCancel.addEventListener("click", resetForm);

function resetForm() {
  eventIdInput.value = "";
  form.reset();
  btnSave.textContent = "Salvar Registro";
  btnCancel.style.display = "none";
}

// Inicialização das funções ao carregar a página
subscribeToEvents();
fetchPublicHolidays();