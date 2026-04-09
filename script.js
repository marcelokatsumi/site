document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loader = document.getElementById('loader');
    const resultsContent = document.getElementById('resultsContent');
    const noResults = document.getElementById('noResults');

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        resultsContent.classList.add('hidden');
        noResults.classList.add('hidden');
        loader.classList.remove('hidden');

        const firstName = query.split(' ')[0] || query;

        // Disparando MÚLTIPLAS APIs gratuitas reais em paralelo
        const [wikiData, demoData, githubData] = await Promise.all([
            fetchWikipedia(query),
            fetchDemographics(firstName),
            fetchGithub(query)
        ]);

        // Se nenhuma das bases retornar NADA ÚTIL
        if (!wikiData && (!demoData || demoData.age === 'N/A') && (!githubData)) {
            loader.classList.add('hidden');
            noResults.classList.remove('hidden');
            return;
        }

        renderDashboard(query, wikiData, demoData, githubData);
        
        loader.classList.add('hidden');
        resultsContent.classList.remove('hidden');
    }

    async function fetchWikipedia(name) {
        try {
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&utf8=&format=json&origin=*`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.query.search.length > 0) {
                const title = searchData.query.search[0].title;
                if (title.toLowerCase().includes(name.split(' ')[0].toLowerCase())) {
                    const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
                    const summaryRes = await fetch(summaryUrl);
                    return await summaryRes.json();
                }
            }
        } catch (e) {} return null;
    }

    async function fetchDemographics(name) {
        try {
            const responses = await Promise.all([
                fetch(`https://api.agify.io/?name=${name}`).then(r => r.json()),
                fetch(`https://api.genderize.io/?name=${name}`).then(r => r.json()),
                fetch(`https://api.nationalize.io/?name=${name}`).then(r => r.json())
            ]);
            
            // Verifica confidência e preenchimento
            if (!responses[0].age && !responses[1].gender) return null;

            return {
                age: responses[0].age ? `${responses[0].age} anos` : "Indeterminada",
                gender: responses[1].gender === 'male' ? 'Masculino' : responses[1].gender === 'female' ? 'Feminino' : 'Desconhecido',
                nationality: (responses[2].country && responses[2].country.length > 0) ? responses[2].country[0].country_id : "Desconhecido"
            };
        } catch(e) { return null; }
    }

    async function fetchGithub(name) {
        try {
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
        const parts = name.split(' ').filter(p => p.length > 0);
        let initials = parts[0] ? parts[0][0].toUpperCase() : '?';
        if (parts.length > 1) initials += parts[parts.length - 1][0].toUpperCase();

        // Foto de Perfil: Github tem prioridade, seguido por Wikipedia, depois Iniciais
        let profileImgUrl = '';
        if (githubData && githubData.avatar) profileImgUrl = githubData.avatar;
        else if (wikiData && wikiData.thumbnail) profileImgUrl = wikiData.thumbnail.source;

        let profileImgHtml = profileImgUrl 
            ? `<img src="${profileImgUrl}" alt="Avatar">`
            : initials;

        let titleHtml = `<h2>${name}</h2>`;
        
        // Se pegou wiki ou github, ele é um "perfil confirmado"
        if (wikiData || githubData) {
            titleHtml += `<span class="tag"><i class="ri-checkbox-circle-fill"></i> Perfil Localizado na Web</span>`;
        }

        // Descrição biográfica vinda apenas da Wiki se aplicável
        let bioHtml = '';
        if (wikiData && wikiData.extract) {
            bioHtml = `<p style="margin-top: 15px; font-size: 1.05rem;">${wikiData.extract}</p>`;
        }

        // HTML das Caixas de Informação encontradas de verdade
        let gridItemsHtml = '';

        if (demoData) {
            gridItemsHtml += `
                <div class="info-item">
                    <h3><i class="ri-history-line"></i> Idade Sugerida (Nome)</h3>
                    <p>${demoData.age}</p>
                </div>
                <div class="info-item">
                    <h3><i class="ri-men-line"></i> Gênero Biológico</h3>
                    <p>${demoData.gender}</p>
                </div>
                <div class="info-item">
                    <h3><i class="ri-map-pin-line"></i> País de Origem ID</h3>
                    <p>${demoData.nationality}</p>
                </div>
            `;
        }

        if (githubData) {
            gridItemsHtml += `
                <div class="info-item full-width" style="margin-bottom: 0;">
                    <h3><i class="ri-code-s-slash-line"></i> Pegada de Desenvolvedor no GitHub Encontrada</h3>
                    <p>O perfil "@${githubData.login}" foi rastreado nesta rede.</p>
                    <a href="${githubData.html_url}" target="_blank" class="github-link"><i class="ri-links-line"></i> Acessar Perfil GitHub Reais</a>
                </div>
            `;
        }

        // Montagem do Card
        const html = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">${profileImgHtml}</div>
                    <div class="profile-title">
                        ${titleHtml}
                        ${bioHtml}
                    </div>
                </div>

                <div class="info-grid">
                    ${gridItemsHtml}
                </div>
            </div>
        `;

        resultsContent.innerHTML = html;
    }
});
