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

        showLoader();

        try {
            // Puxando dados REAIS usando a API da Wikipedia em português
            // 1. Procurar pela pessoa para pegar o título exato da página
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.query.search.length === 0) {
                showNoResults();
                return;
            }

            // Pega o título da primeira correspondência (a pessoa real)
            const title = searchData.query.search[0].title;

            // 2. Buscar o Resumo (Summary) e Imagem reais da pessoa
            const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
            const summaryRes = await fetch(summaryUrl);
            const summaryData = await summaryRes.json();

            if (summaryData.type === 'disambiguation' || !summaryData.extract) {
                showNoResults();
                return;
            }

            renderProfile(summaryData);

        } catch (error) {
            console.error("Erro ao buscar informações:", error);
            showNoResults();
        }
    }

    function renderProfile(data) {
        // Dados reais puxados da API
        const nome = data.title;
        const descricao = data.description || "Personalidade / Figura Pública";
        const biografia = data.extract;
        const urlWiki = data.content_urls.desktop.page;
        
        let imgHtml = '';
        if (data.thumbnail && data.thumbnail.source) {
            imgHtml = `<img src="${data.thumbnail.source}" alt="Foto de ${nome}" class="profile-img">`;
        } else {
            imgHtml = `<div class="profile-avatar-placeholder"><i class="ri-user-line"></i></div>`;
        }

        const html = `
            <div class="profile-card">
                ${imgHtml}
                <div class="profile-info">
                    <h2 class="profile-name">${nome}</h2>
                    <p class="profile-desc">${descricao}</p>
                    <p class="profile-bio">${biografia}</p>
                    
                    <div class="actions">
                        <a href="${urlWiki}" target="_blank" class="btn-secondary">
                            <i class="ri-article-line"></i> Relatório Completo
                        </a>
                        <a href="https://www.google.com/search?q=${encodeURIComponent(nome)}" target="_blank" class="btn-secondary">
                            <i class="ri-google-fill"></i> Procurar na Web
                        </a>
                    </div>
                </div>
            </div>
        `;

        resultsContent.innerHTML = html;
        loader.classList.add('hidden');
        noResults.classList.add('hidden');
        resultsContent.classList.remove('hidden');
    }

    function showLoader() {
        resultsContent.classList.add('hidden');
        noResults.classList.add('hidden');
        loader.classList.remove('hidden');
    }

    function showNoResults() {
        loader.classList.add('hidden');
        resultsContent.classList.add('hidden');
        noResults.classList.remove('hidden');
    }
});
