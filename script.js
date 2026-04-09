document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loader = document.getElementById('loader');
    const resultsContent = document.getElementById('resultsContent');

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        resultsContent.classList.add('hidden');
        loader.classList.remove('hidden');

        // Extrair o primeiro nome para a estatística global
        const firstName = query.split(' ')[0] || query;

        // Disparando MÚLTIPLAS APIs gratuitas reais em paralelo (O MÁXIMO POSSÍVEL NO CLIENTE)
        const [wikiData, demoData, githubData] = await Promise.all([
            fetchWikipedia(query),
            fetchDemographics(firstName),
            fetchGithub(query)
        ]);

        renderDashboard(query, wikiData, demoData, githubData);
        
        loader.classList.add('hidden');
        resultsContent.classList.remove('hidden');
    }

    // 1. DADOS REAIS: API WIKIPEDIA (Resumo e Foto Pública)
    async function fetchWikipedia(name) {
        try {
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&utf8=&format=json&origin=*`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.query.search.length > 0) {
                const title = searchData.query.search[0].title;
                // Exige que ao menos parte do nome buscado bata com o título, para evitar falsos positivos estranhos
                if (title.toLowerCase().includes(name.split(' ')[0].toLowerCase())) {
                    const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
                    const summaryRes = await fetch(summaryUrl);
                    return await summaryRes.json();
                }
            }
        } catch (e) {} return null;
    }

    // 2. DADOS REAIS: Dados Estatísticos e Demográficos de Bancos Preditivos e IBGE/Mundial
    async function fetchDemographics(name) {
        try {
            const responses = await Promise.all([
                fetch(`https://api.agify.io/?name=${name}`).then(r => r.json()),
                fetch(`https://api.genderize.io/?name=${name}`).then(r => r.json()),
                fetch(`https://api.nationalize.io/?name=${name}`).then(r => r.json())
            ]);
            return {
                age: responses[0].age || "N/A",
                gender: responses[1].gender === 'male' ? 'Masculino' : responses[1].gender === 'female' ? 'Feminino' : 'Desconhecido',
                nationality: responses[2].country[0] ? responses[2].country[0].country_id : "N/A"
            };
        } catch(e) { return null; }
    }

    // 3. DADOS REAIS: Pegada Tecnológica no GitHub
    async function fetchGithub(name) {
        try {
            // Busca usuários compatíveis com a string do nome
            const url = `https://api.github.com/search/users?q=${encodeURIComponent(name)}&per_page=1`;
            const res = await fetch(url);
            const data = await res.json();
            if(data.items && data.items.length > 0) {
                const userObj = data.items[0];
                return {
                    login: userObj.login,
                    avatar: userObj.avatar_url,
                    html_url: userObj.html_url
                };
            }
        } catch(e){} return null;
    }

    function renderDashboard(name, wikiData, demoData, githubData) {
        const encodedName = encodeURIComponent(name);
        const exactNameParams = encodeURIComponent(`"${name}"`);

        const parts = name.split(' ').filter(p => p.length > 0);
        let initials = parts[0] ? parts[0][0].toUpperCase() : '?';
        if (parts.length > 1) initials += parts[parts.length - 1][0].toUpperCase();

        let profileImg = `<div class="profile-avatar">${initials}</div>`;
        let bio = "Dados coletados via fontes abertas e predição demográfica.";

        if (wikiData && wikiData.thumbnail) {
            profileImg = `<div class="profile-avatar"><img src="${wikiData.thumbnail.source}"></div>`;
            bio = wikiData.description ? wikiData.description : bio;
        }

        // HTML dos Dados Extraídos
        let statsHtml = '';
        if (demoData) {
            statsHtml = `
                <h3 class="section-title"><i class="ri-bar-chart-box-line"></i> Análise de Inteligência Demográfica (Baseado no nome principal)</h3>
                <div class="data-insight-grid">
                    <div class="insight-box">
                        <h4><i class="ri-user-smile-line"></i> Idade Provável</h4>
                        <p>${demoData.age} anos</p>
                    </div>
                    <div class="insight-box">
                        <h4><i class="ri-men-line"></i> Gênero Biológico</h4>
                        <p>${demoData.gender}</p>
                    </div>
                    <div class="insight-box">
                        <h4><i class="ri-map-pin-line"></i> País de Origem ID</h4>
                        <p>${demoData.nationality}</p>
                    </div>
                </div>
            `;
        }

        let gitHtml = '';
        if (githubData) {
            gitHtml = `
                <div class="github-card">
                    <img src="${githubData.avatar}" alt="Github Avatar">
                    <div class="github-info">
                        <h4>Conta GitHub Localizada na Web!</h4>
                        <a href="${githubData.html_url}" target="_blank"><i class="ri-github-fill"></i> @${githubData.login} - Ver Perfil Completo</a>
                    </div>
                </div>
            `;
        }

        // Montagem Final do HTML
        const html = `
            <div class="osint-card">
                <div class="osint-header">
                    ${profileImg}
                    <div class="header-info">
                        <h2>${name}</h2>
                        <p>${bio}</p>
                    </div>
                </div>

                ${statsHtml}
                ${gitHtml}

                <h3 class="section-title"><i class="ri-radar-line"></i> Hub OSINT - Busca Profunda em Sistemas Brasileiros</h3>
                <div class="osint-grid">
                    <div class="tool-category">
                        <h3>Processos (Jusbrasil & Escavador)</h3>
                        <div class="link-list">
                            <a href="https://www.jusbrasil.com.br/consulta-processual/busca?q=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-scales-3-line"></i> Verificar Judiciário</span>
                            </a>
                            <a href="https://www.escavador.com/busca?q=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-article-line"></i> Verificar Receita / Diários Oficiais</span>
                            </a>
                        </div>
                    </div>

                    <div class="tool-category">
                        <h3>Redes Sociais Stricto</h3>
                        <div class="link-list">
                            <a href="https://www.linkedin.com/search/results/all/?keywords=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-linkedin-box-fill"></i> LinkedIn Profissional</span>
                            </a>
                            <a href="https://www.instagram.com/explore/search/keyword/?q=${encodedName}" target="_blank" class="scan-btn">
                                <span><i class="ri-instagram-line"></i> Instagram Publico</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        resultsContent.innerHTML = html;
    }
});
