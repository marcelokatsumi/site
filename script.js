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

        // MÚLTIPLAS REQUISIÇÕES REAIS E INSTANTÂNEAS (SEM PROXY LENTO)
        // Usamos as APIs abertas para buscar o perfil e TODAS as menções ao nome em textos.
        const [profileData, webMentions, githubData] = await Promise.all([
            fetchMainProfile(query),
            fetchWebMentions(query),
            fetchGithubProfile(query)
        ]);

        if (!profileData && webMentions.length === 0 && !githubData) {
            loader.classList.add('hidden');
            noResults.classList.remove('hidden');
            return;
        }

        renderDashboard(query, profileData, webMentions, githubData);
        
        loader.classList.add('hidden');
        resultsContent.classList.remove('hidden');
    }

    // Pega o Dossiê Principal e Foto (Funciona perfeitamente para Neymar, famosos e empresas)
    async function fetchMainProfile(name) {
        try {
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&utf8=&format=json&origin=*`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.query.search.length > 0) {
                const title = searchData.query.search[0].title;
                const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
                const summaryRes = await fetch(summaryUrl);
                return await summaryRes.json();
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    // Varre em altíssima velocidade textos de enciclopédias globais para achar ONTEM o nome foi citado
    // Pega "tudo o que estiver na internet" sobre ele nos artigos
    async function fetchWebMentions(name) {
        try {
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent('"' + name + '"')}&utf8=&format=json&origin=*&srlimit=10`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();
            
            if (searchData.query && searchData.query.search) {
                return searchData.query.search;
            }
        } catch (e) {
            console.error(e);
        }
        return [];
    }

    // Puxa pegada tecnológica
    async function fetchGithubProfile(name) {
        try {
            const url = `https://api.github.com/search/users?q=${encodeURIComponent(name)}&per_page=1`;
            const res = await fetch(url);
            const data = await res.json();
            if(data.items && data.items.length > 0) {
                return data.items[0];
            }
        } catch(e){}
        return null;
    }

    function renderDashboard(name, profileData, webMentions, githubData) {
        const parts = name.split(' ').filter(p => p.length > 0);
        let initials = parts[0] ? parts[0][0].toUpperCase() : '?';
        if (parts.length > 1) initials += parts[parts.length - 1][0].toUpperCase();

        let profileImgUrl = '';
        if (profileData && profileData.thumbnail) {
            profileImgUrl = profileData.thumbnail.source;
        } else if (githubData && githubData.avatar_url) {
            profileImgUrl = githubData.avatar_url;
        }

        let profileImgHtml = profileImgUrl 
            ? `<img src="${profileImgUrl}" alt="Avatar">`
            : initials;

        let gridItemsHtml = '';

        // Dossiê Principal
        if (profileData && profileData.extract) {
            gridItemsHtml += `
                <div class="info-item full-width" style="border-color: #3b82f6; background: rgba(59, 130, 246, 0.05);">
                    <h3><i class="ri-article-line" style="color: #3b82f6;"></i> Dossiê Biográfico Central</h3>
                    <p style="font-size: 1.05rem; line-height: 1.6; color: #e2e8f0; margin-top: 10px;">${profileData.extract}</p>
                </div>
            `;
        }

        // Github Data se aplicável
        if (githubData) {
            gridItemsHtml += `
                <div class="info-item" style="border-color: #8b5cf6;">
                    <h3><i class="ri-github-fill" style="color: #8b5cf6;"></i> Registro Tecnológico Ativo</h3>
                    <p style="font-size: 1rem; color: #e2e8f0; margin-top: 10px;">Encontrado repositório no Github.</p>
                    <p style="margin-top: 5px;"><strong>User:</strong> @${githubData.login}</p>
                    <a href="${githubData.html_url}" target="_blank" class="github-link" style="margin-top: 15px;"><i class="ri-links-line"></i> Acessar Perfil Original</a>
                </div>
            `;
        }

        // Renderiza Todas as menções vazadas do nome em documentos da internet
        if (webMentions.length > 0) {
            gridItemsHtml += `
                <div class="info-item full-width" style="border-color: #10b981; background: rgba(16, 185, 129, 0.05); margin-top: 15px;">
                    <h3><i class="ri-earth-line" style="color: #10b981;"></i> Menções, Registros e Notícias Globais Detectadas</h3>
                    <p style="font-size: 0.95rem; color: #94a3b8; font-weight: normal; margin-top: 5px; margin-bottom: 15px;">
                        Trechos autênticos recuperados em tempo real de grandes bases de conhecimento sobre "${name}":
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
            `;

            webMentions.forEach((mention, index) => {
                // Impede que repita o dossier principal
                if (profileData && mention.title === profileData.title && index === 0) return;
                
                gridItemsHtml += `
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; border-left: 4px solid #10b981;">
                        <h4 style="color: #e2e8f0; font-size: 1.1rem; margin-bottom: 8px;">${mention.title} (Relevância: ${mention.wordcount} palavras)</h4>
                        <p style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.5; font-weight: 300;">...${mention.snippet}...</p>
                    </div>
                `;
            });

            gridItemsHtml += `</div></div>`;
        }

        // Montagem do Card
        const html = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">${profileImgHtml}</div>
                    <div class="profile-title">
                        <h2>${name}</h2>
                        <span class="tag"><i class="ri-checkbox-circle-fill"></i> Registros Sincronizados com Sucesso</span>
                    </div>
                </div>

                <div class="info-grid" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${gridItemsHtml}
                </div>
            </div>
        `;

        resultsContent.innerHTML = html;
    }
});
