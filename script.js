// Banco de dados fictício para simulação
const mockDatabase = [
    {
        name: "Carlos Eduardo Silva",
        document: "123.456.789-00",
        email: "carlos.silva.dev@email.com",
        phone: "+55 (11) 98765-4321",
        address: "Rua das Laranjeiras, 145, Apartamento 12, São Paulo - SP",
        dob: "15/04/1988",
        status: "Ativo",
        profession: "Engenheiro de Software",
        company: "TechNova Solutions",
        social: {
            linkedin: "#",
            github: "#",
            twitter: "#"
        }
    },
    {
        name: "Ana Júlia Costa",
        document: "987.654.321-11",
        email: "anaj.costa@email.com",
        phone: "+55 (21) 97777-8888",
        address: "Av. Atlântica, 444, Rio de Janeiro - RJ",
        dob: "22/11/1992",
        status: "Ativo",
        profession: "Designer UX/UI",
        company: "Creative Studio BR",
        social: {
            linkedin: "#",
            dribbble: "#",
            instagram: "#"
        }
    },
    {
        name: "João Pedro Santos",
        document: "111.222.333-44",
        email: "joao.santos@email.com",
        phone: "+55 (31) 96666-5555",
        address: "Rua da Bahia, 1020, Belo Horizonte - MG",
        dob: "05/01/1985",
        status: "Ativo",
        profession: "Analista Financeiro",
        company: "Banco InvestCorp",
        social: {
            linkedin: "#"
        }
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loader = document.getElementById('loader');
    const resultsContent = document.getElementById('resultsContent');
    const noResults = document.getElementById('noResults');

    // Inicialização do estado
    loader.classList.add('hidden');

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!query) return;

        // Limpa resultados e exibe o loader (simula requisição HTTP à API)
        resultsContent.classList.add('hidden');
        noResults.classList.add('hidden');
        loader.classList.remove('hidden');

        // Simulando delay de rede de API
        setTimeout(() => {
            loader.classList.add('hidden');
            
            // Busca no banco mockado (busca por trecho do nome ou documento)
            const result = mockDatabase.find(person => 
                person.name.toLowerCase().includes(query) || 
                person.document.replace(/[^\d]/g, '').includes(query.replace(/[^\d]/g, '')) ||
                person.email.toLowerCase().includes(query)
            );

            if (result) {
                renderProfile(result);
            } else {
                noResults.classList.remove('hidden');
            }
        }, 1500);
    }

    function renderProfile(data) {
        // Obter iniciais do nome
        const initials = data.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

        // Construir ícones de redes sociais dinâmico
        let socialHTML = '';
        if (data.social.linkedin) socialHTML += `<a href="${data.social.linkedin}" title="LinkedIn"><i class="ri-linkedin-fill"></i></a>`;
        if (data.social.github) socialHTML += `<a href="${data.social.github}" title="GitHub"><i class="ri-github-fill"></i></a>`;
        if (data.social.twitter) socialHTML += `<a href="${data.social.twitter}" title="Twitter"><i class="ri-twitter-x-fill"></i></a>`;
        if (data.social.instagram) socialHTML += `<a href="${data.social.instagram}" title="Instagram"><i class="ri-instagram-line"></i></a>`;
        if (data.social.dribbble) socialHTML += `<a href="${data.social.dribbble}" title="Dribbble"><i class="ri-dribbble-line"></i></a>`;

        const html = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">${initials}</div>
                    <div class="profile-title">
                        <h2>${data.name}</h2>
                        <span class="tag"><i class="ri-checkbox-circle-fill"></i> Perfil Verificado</span>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <h3><i class="ri-id-card-line"></i> Documento Oficial</h3>
                        <p>${data.document}</p>
                    </div>
                    <div class="info-item">
                        <h3><i class="ri-mail-line"></i> E-mail</h3>
                        <p>${data.email}</p>
                    </div>
                    <div class="info-item">
                        <h3><i class="ri-phone-line"></i> Telefone</h3>
                        <p>${data.phone}</p>
                    </div>
                    <div class="info-item">
                        <h3><i class="ri-calendar-event-line"></i> Data de Nascimento</h3>
                        <p>${data.dob}</p>
                    </div>
                    <div class="info-item">
                        <h3><i class="ri-briefcase-4-line"></i> Profissão</h3>
                        <p>${data.profession}</p>
                    </div>
                    <div class="info-item">
                        <h3><i class="ri-building-line"></i> Empresa</h3>
                        <p>${data.company}</p>
                    </div>
                    <div class="info-item" style="grid-column: 1 / -1;">
                        <h3><i class="ri-map-pin-line"></i> Endereço Completo</h3>
                        <p>${data.address}</p>
                    </div>
                </div>

                <div class="info-item" style="margin-bottom: 0;">
                    <h3><i class="ri-links-line"></i> Pegadas Digitais Encontradas</h3>
                    <div class="social-links" style="margin-top: 10px;">
                        ${socialHTML}
                    </div>
                </div>
            </div>
        `;

        resultsContent.innerHTML = html;
        resultsContent.classList.remove('hidden');
    }
});
