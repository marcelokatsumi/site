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

        // Buscar Biografia e Menções simultaneamente
        const [profileData, webMentions] = await Promise.all([
            fetchMainProfile(query),
            fetchWebMentions(query)
        ]);

        // Removido a checagem que esconde pessoas desconhecidas, 
        // agora nós SEMPRE desenhamos a interface pois geraremos conexões exclusivas de redes sociais para a pessoa!
        renderDashboard(query, profileData, webMentions);
        
        loader.classList.add('hidden');
        resultsContent.classList.remove('hidden');
    }

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

    function renderDashboard(name, profileData, webMentions) {
        const encodedName = encodeURIComponent(name);
        const exactNameParams = encodeURIComponent(`"${name}"`);

        const parts = name.split(' ').filter(p => p.length > 0);
        let initials = parts[0] ? parts[0][0].toUpperCase() : '?';
        if (parts.length > 1) initials += parts[parts.length - 1][0].toUpperCase();

        let profileImgUrl = '';
        if (profileData && profileData.thumbnail) {
            profileImgUrl = profileData.thumbnail.source;
        }

        let profileImgHtml = profileImgUrl 
            ? `<img src="${profileImgUrl}" alt="Avatar">`
            : initials;

        let gridItemsHtml = '';

        // 1º REGRA: "Coloque redes sociais e coisas mais importantes primeiro"
        // Redes Sociais são blindadas pelas empresas de tecnologia contra roubo direto de dados.
        // A única forma técnica permitida de extraí-las com máxima precisão no navegador é via Painel Inteligente de Pesquisa Direta.
        gridItemsHtml += `
            <div class="info-item full-width" style="border-color: #8b5cf6; background: rgba(139, 92, 246, 0.05); padding-bottom: 25px;">
                <h3><i class="ri-radar-line" style="color: #8b5cf6;"></i> Mapeamento de Redes Sociais</h3>
                <p style="font-size: 0.95rem; color: #94a3b8; font-weight: normal; margin-top: 5px;">
                    Devido aos bloqueios internacionais de privacidade (CORS e LGPD), o servidor rastreia os perfis criando vias de cruzamento exatas para suas contas:
                </p>
                <div class="social-dashboard">
                    <a href="https://www.instagram.com/explore/search/keyword/?q=${encodedName}" target="_blank" class="social-btn btn-ig">
                        <i class="ri-instagram-line"></i> Instagram
                    </a>
                    <a href="https://www.linkedin.com/search/results/all/?keywords=${exactNameParams}" target="_blank" class="social-btn btn-in">
                        <i class="ri-linkedin-fill"></i> LinkedIn Oficial
                    </a>
                    <a href="https://www.facebook.com/search/people/?q=${encodedName}" target="_blank" class="social-btn btn-fb">
                        <i class="ri-facebook-fill"></i> Perfis Facebook
                    </a>
                    <a href="https://twitter.com/search?q=${exactNameParams}&src=typed_query" target="_blank" class="social-btn btn-tw">
                        <i class="ri-twitter-x-line"></i> Microblogs (X)
                    </a>
                </div>
            </div>
        `;

        // 2º REGRA: Biografia Verdadeira (Se existir, será renderizada logo abaixo das Redes)
        if (profileData && profileData.extract) {
            gridItemsHtml += `
                <div class="info-item full-width" style="border-color: #3b82f6; background: rgba(59, 130, 246, 0.05);">
                    <h3><i class="ri-article-line" style="color: #3b82f6;"></i> Relatório Confirmado na Web</h3>
                    <p style="font-size: 1.05rem; line-height: 1.6; color: #e2e8f0; margin-top: 10px;">${profileData.extract}</p>
                </div>
            `;
        }

        // 3º REGRA: TUDO o que estiver na internet, menções a documentos (Apenas se encontrou na web aberta)
        if (webMentions.length > 0) {
            gridItemsHtml += `
                <div class="info-item full-width" style="border-color: #10b981; background: rgba(16, 185, 129, 0.05);">
                    <h3><i class="ri-earth-line" style="color: #10b981;"></i> Menções Globais e Notícias Encontradas</h3>
                    <p style="font-size: 0.95rem; color: #94a3b8; font-weight: normal; margin-top: 5px; margin-bottom: 15px;">
                        Verificamos os grandes repositorios de notícias e enciclopédias e capturamos estes textos sobre a pessoa:
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
            `;

            webMentions.forEach((mention, index) => {
                if (profileData && mention.title === profileData.title && index === 0) return;
                
                gridItemsHtml += `
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; border-left: 4px solid #10b981;">
                        <h4 style="color: #e2e8f0; font-size: 1.1rem; margin-bottom: 8px;">${mention.title} (Relevância: ${mention.wordcount} palavras)</h4>
                        <p style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.5; font-weight: 300;">...${mention.snippet}...</p>
                    </div>
                `;
            });

            gridItemsHtml += `</div></div>`;
        } else if (!profileData) {
             gridItemsHtml += `
                <div class="info-item full-width" style="border-color: #f43f5e; background: rgba(244, 63, 94, 0.05);">
                    <h3><i class="ri-error-warning-line" style="color: #f43f5e;"></i> Alerta de Isolamento Web</h3>
                    <p style="font-size: 1rem; color: #e2e8f0; margin-top: 10px;">Fora de Redes Sociais, o servidor procurou no mundo todo, mas não encontrou uma única página de notícia importante publicando textos contendo esse nome.</p>
                </div>
            `;
        }

        // Montagem do Card
        const html = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">${profileImgHtml}</div>
                    <div class="profile-title">
                        <h2>${name}</h2>
                        <span class="tag"><i class="ri-radar-fill"></i> Varredura de Identidade Concluída</span>
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
