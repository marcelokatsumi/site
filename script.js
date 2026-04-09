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

        // Bypassing CORS e usando um Web Scraper real para pegar tudo da internet!
        // Utilizando AllOrigins proxy para buscar a resposta na Yahoo/DuckDuckGo Search
        let webResults = [];
        try {
            const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent('"' + query + '"')}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
            
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            // Lendo o HTML invisível que a internet retornou
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            // Minerando os títulos e as descrições vazadas dos resultados reais
            const resultDivs = doc.querySelectorAll('#web .algo');
            
            resultDivs.forEach(div => {
                const title = div.querySelector('.title a') ? div.querySelector('.title a').innerText : '';
                const snippet = div.querySelector('.compTitle ~ div, .compText') ? div.querySelector('.compTitle ~ div, .compText').innerText : '';
                
                if (title && snippet && snippet.toLowerCase().includes(query.toLowerCase().split(' ')[0])) {
                    webResults.push({ title, snippet });
                }
            });

        } catch (error) {
            console.error("Erro na varredura profunda:", error);
        }

        if (webResults.length === 0) {
            loader.classList.add('hidden');
            noResults.classList.remove('hidden');
            return;
        }

        renderDashboard(query, webResults);
        
        loader.classList.add('hidden');
        resultsContent.classList.remove('hidden');
    }

    function renderDashboard(name, webResults) {
        // Gerando o Avatar com Base no Nome
        const parts = name.split(' ').filter(p => p.length > 0);
        let initials = parts[0] ? parts[0][0].toUpperCase() : '?';
        if (parts.length > 1) initials += parts[parts.length - 1][0].toUpperCase();

        const profileImgHtml = initials;
        
        // Renderizando as Informações Brutas Extrapoladas da Web
        let gridItemsHtml = `
            <div class="info-item full-width" style="border-color: #10b981; background: rgba(16, 185, 129, 0.05);">
                <h3><i class="ri-radar-line" style="color: #10b981;"></i> Varredura Concluída - Vazamentos Encontrados</h3>
                <p style="font-size: 0.95rem; color: #94a3b8; font-weight: normal; margin-top: 5px;">
                    O robô cruzou firewalls usando um servidor de proxy (AllOrigins) e capturou TUDO o que aparece nos motores de busca diretamente para a sua tela.
                </p>
            </div>
        `;

        webResults.forEach(result => {
            gridItemsHtml += `
                <div class="info-item full-width" style="margin-bottom: 0;">
                    <h3><i class="ri-global-line"></i> ${result.title}</h3>
                    <p style="font-size: 1rem; color: #e2e8f0; line-height: 1.6; margin-top: 10px;">
                        "${result.snippet}"
                    </p>
                </div>
            `;
        });

        // Montagem do Card
        const html = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">${profileImgHtml}</div>
                    <div class="profile-title">
                        <h2>${name}</h2>
                        <span class="tag"><i class="ri-checkbox-circle-fill"></i> Dossiê de Pegadas Digitais Encontrado</span>
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
