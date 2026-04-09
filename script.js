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

        // O processo de varredura demora um pouco por conta as várias conexões.
        // Simulamos o tempo de carregamento com setTimeout para não sobrecarregar o navegador antes de renderizar os links de acesso rápido.
        setTimeout(async () => {
            const wikiData = await checkWikipedia(query);
            renderDashboard(query, wikiData);
        }, 3500); // 3.5 sec loader
    }

    // Apenas checar se existe foto ou biografia rápida no Wikipedia (figuras famosas)
    async function checkWikipedia(name) {
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
        } catch (e) {}
        return null; // Nada na Wiki
    }

    function renderDashboard(name, wikiData) {
        const encodedName = encodeURIComponent(name);
        // Colocando o nome entre aspas para forçar buscadores a procurar a frase exata
        const exactNameParams = encodeURIComponent(`"${name}"`);

        // Geração das iniciais caso não tenha foto
        const parts = name.split(' ').filter(p => p.length > 0);
        let initials = parts[0] ? parts[0][0].toUpperCase() : '?';
        if (parts.length > 1) {
            initials += parts[parts.length - 1][0].toUpperCase();
        }

        // Variáveis de perfil base
        let profileImg = `<div class="profile-avatar">${initials}</div>`;
        let bio = "Monitoramento ativo. Utilize os motores de rastreamento abaixo para visualizar informações detalhadas em tempo real.";

        if (wikiData && wikiData.thumbnail) {
            profileImg = `<div class="profile-avatar"><img src="${wikiData.thumbnail.source}"></div>`;
            bio = wikiData.description ? wikiData.description : bio;
        }

        const html = `
            <div class="osint-card">
                <div class="osint-header">
                    ${profileImg}
                    <div class="header-info">
                        <h2>${name}</h2>
                        <p>${bio}</p>
                    </div>
                </div>

                <div class="osint-grid">
                    <!-- Redes Sociais -->
                    <div class="tool-category">
                        <h3><i class="ri-share-line"></i> Mídias e Redes Sociais</h3>
                        <div class="link-list">
                            <a href="https://www.linkedin.com/search/results/all/?keywords=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-linkedin-box-fill brand"></i> LinkedIn</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                            <a href="https://www.facebook.com/search/people?q=${encodedName}" target="_blank" class="scan-btn">
                                <span><i class="ri-facebook-circle-fill brand"></i> Facebook</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                            <a href="https://www.instagram.com/explore/search/keyword/?q=${encodedName}" target="_blank" class="scan-btn">
                                <span><i class="ri-instagram-line brand"></i> Instagram</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                            <a href="https://twitter.com/search?q=${exactNameParams}&src=typed_query" target="_blank" class="scan-btn">
                                <span><i class="ri-twitter-x-fill brand"></i> X / Twitter</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Dados Oficiais e Jurídicos -->
                    <div class="tool-category">
                        <h3><i class="ri-government-line"></i> Registros Públicos & Jurídicos</h3>
                        <div class="link-list">
                            <a href="https://www.jusbrasil.com.br/consulta-processual/busca?q=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-scales-3-line brand"></i> Jusbrasil Processos</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                            <a href="https://www.escavador.com/busca?q=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-article-line brand"></i> Escavador / Diário Oficial</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                            <a href="https://portaldatransparencia.gov.br/busca?termo=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-bank-card-line brand"></i> Portal da Transparência</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Buscadores Profundos -->
                    <div class="tool-category">
                        <h3><i class="ri-global-line"></i> Varredura Profunda na Web</h3>
                        <div class="link-list">
                            <a href="https://www.google.com/search?q=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-google-fill brand" style="color: #ea4335;"></i> Google Search Dorks</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                            <a href="https://duckduckgo.com/?q=${exactNameParams}" target="_blank" class="scan-btn">
                                <span><i class="ri-search-eye-line brand" style="color: #DE5833;"></i> DuckDuckGo Tracker</span>
                                <i class="ri-external-link-line arrow"></i>
                            </a>
                        </div>
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
});
