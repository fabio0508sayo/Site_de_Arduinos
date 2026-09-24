/* =========================================================
   Site de Arduinos — main.js
   Responsável por:
     1) Menu lateral (gaveta no celular)
     2) Barra de progresso de leitura e botão "voltar ao topo"
     3) Colorização simples dos códigos Arduino
     4) Botão "Copiar" dos blocos de código
     5) Busca e filtros do catálogo de sensores
     6) Simulação "do sensor ao atuador" da página inicial
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* ---------------------------------------------------
       1) MENU LATERAL
       No desktop o menu fica fixo. No celular ele vira uma
       gaveta aberta pelo botão da barra superior.
    --------------------------------------------------- */
    const sidebar = document.getElementById("sidebar");
    const scrim = document.getElementById("scrim");
    const menuToggle = document.getElementById("menuToggle");

    function setMenu(open) {
        if (!sidebar) return;
        sidebar.classList.toggle("open", open);
        if (scrim) scrim.classList.toggle("show", open);
        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", String(open));
            menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener("click", function () {
            setMenu(!sidebar.classList.contains("open"));
        });
    }
    if (scrim) scrim.addEventListener("click", function () { setMenu(false); });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMenu(false);
    });

    if (sidebar) {
        // fecha a gaveta ao escolher uma página
        sidebar.querySelectorAll("a").forEach(function (a) {
            a.addEventListener("click", function () { setMenu(false); });
        });

        // deixa o item da página atual visível dentro do menu
        const atual = sidebar.querySelector('[aria-current="page"]');
        if (atual) atual.scrollIntoView({ block: "center" });
    }

    /* ---------------------------------------------------
       2) PROGRESSO DE LEITURA E VOLTAR AO TOPO
    --------------------------------------------------- */
    const rail = document.getElementById("powerRail");
    const toTop = document.getElementById("toTop");

    function onScroll() {
        const doc = document.documentElement;
        const total = doc.scrollHeight - doc.clientHeight;
        const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
        if (rail) rail.style.width = pct + "%";
        if (toTop) toTop.hidden = window.scrollY < 600;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
        toTop.addEventListener("click", function () {
            window.scrollTo({ top: 0 });
        });
    }

    /* ---------------------------------------------------
       3) COLORIZAÇÃO DO CÓDIGO
       Um "tokenizador" pequeno para C/C++ do Arduino:
       comentários, textos, diretivas, números, palavras
       reservadas e nomes de funções.
    --------------------------------------------------- */
    const PALAVRAS = "void|int|float|double|long|short|char|byte|bool|boolean|unsigned|signed|const|static|volatile|" +
        "if|else|for|while|do|switch|case|break|continue|return|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|" +
        "LED_BUILTIN|String|size_t|uint8_t|uint16_t|uint32_t|struct|class|new|delete";

    const REGEX_CODIGO = new RegExp(
        "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)" +                 // 1 comentário
        "|(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*')" + // 2 texto
        "|(^[ \\t]*#[ \\t]*\\w+)" +                                 // 3 diretiva (#include, #define)
        "|\\b(0x[0-9A-Fa-f]+|\\d+\\.?\\d*[fFuUlL]*)\\b" +           // 4 número
        "|\\b(" + PALAVRAS + ")\\b" +                              // 5 palavra reservada
        "|\\b([A-Za-z_]\\w*)(?=\\s*\\()",                           // 6 função
        "gm"
    );

    function escapar(t) {
        return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function colorir(codigo) {
        let saida = "";
        let ultimo = 0;
        let m;
        REGEX_CODIGO.lastIndex = 0;

        while ((m = REGEX_CODIGO.exec(codigo)) !== null) {
            saida += escapar(codigo.slice(ultimo, m.index));
            const classe = m[1] ? "tok-c" : m[2] ? "tok-s" : m[3] ? "tok-p" : m[4] ? "tok-n" : m[5] ? "tok-k" : "tok-f";
            saida += '<span class="' + classe + '">' + escapar(m[0]) + "</span>";
            ultimo = m.index + m[0].length;
            if (m[0].length === 0) REGEX_CODIGO.lastIndex++;
        }
        return saida + escapar(codigo.slice(ultimo));
    }

    document.querySelectorAll(".firmware-section code").forEach(function (bloco) {
        bloco.innerHTML = colorir(bloco.textContent);
    });

    /* ---------------------------------------------------
       4) BOTÃO "COPIAR" DOS BLOCOS DE CÓDIGO
    --------------------------------------------------- */
    function copiarTexto(texto) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(texto);
        }
        // alternativa para páginas abertas direto do arquivo (file://)
        return new Promise(function (resolve, reject) {
            const area = document.createElement("textarea");
            area.value = texto;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            try {
                document.execCommand("copy") ? resolve() : reject();
            } catch (erro) {
                reject(erro);
            }
            document.body.removeChild(area);
        });
    }

    document.querySelectorAll(".copy-btn").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const secao = botao.closest(".firmware-section");
            const codigo = secao ? secao.querySelector("code") : null;
            if (!codigo) return;

            copiarTexto(codigo.textContent).then(function () {
                botao.textContent = "Copiado!";
                botao.classList.add("done");
            }).catch(function () {
                botao.textContent = "Selecione e copie";
            }).then(function () {
                setTimeout(function () {
                    botao.textContent = "Copiar código";
                    botao.classList.remove("done");
                }, 2000);
            });
        });
    });

    /* ---------------------------------------------------
       5) CATÁLOGO DE SENSORES: BUSCA + FILTRO POR CATEGORIA
    --------------------------------------------------- */
    const campoBusca = document.getElementById("buscaSensor");
    const cards = document.querySelectorAll("#sensoresGrid .part-tile");

    if (campoBusca && cards.length) {
        const botoesFiltro = document.querySelectorAll(".filter-chip");
        const contador = document.getElementById("contadorResultados");
        const semResultados = document.getElementById("semResultados");
        let categoriaAtual = "todos";

        function normalizar(t) {
            return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        function aplicarFiltros() {
            const termo = normalizar(campoBusca.value.trim());
            let visiveis = 0;

            cards.forEach(function (card) {
                const nome = normalizar(card.getAttribute("data-nome"));
                const categoria = card.getAttribute("data-categoria");
                const mostrar = nome.includes(termo) && (categoriaAtual === "todos" || categoria === categoriaAtual);
                card.hidden = !mostrar;
                if (mostrar) visiveis++;
            });

            contador.textContent = "Mostrando " + visiveis + " de " + cards.length + " sensores";
            semResultados.classList.toggle("show", visiveis === 0);
        }

        campoBusca.addEventListener("input", aplicarFiltros);

        botoesFiltro.forEach(function (botao) {
            botao.addEventListener("click", function () {
                categoriaAtual = botao.getAttribute("data-categoria");
                botoesFiltro.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
                botao.setAttribute("aria-pressed", "true");
                aplicarFiltros();
            });
        });
    }

    /* ---------------------------------------------------
       6) SIMULAÇÃO "DO SENSOR AO ATUADOR" (página inicial)
       Acende cada nó do circuito em sequência e explica o
       que acontece com o dado em cada etapa.
    --------------------------------------------------- */
    const botaoSim = document.getElementById("trigger-animation");

    if (botaoSim) {
        const nos = document.querySelectorAll(".circuit-path .node-wrap");
        const linhas = document.querySelectorAll(".circuit-path .path-line");
        const saida = document.getElementById("simOutput");

        const etapas = [
            { nome: "Sensor", texto: "O sensor mede uma grandeza física (temperatura, distância, corrente, vibração...) e a converte em sinal elétrico." },
            { nome: "Arduino", texto: "O microcontrolador (Arduino, ESP32, ESP8266) lê o sinal e o converte em um dado digital." },
            { nome: "Rede", texto: "O dado é transmitido por um protocolo de comunicação: analógico, digital, I2C, SPI, UART ou 4-20 mA." },
            { nome: "Controle", texto: "A lógica de controle do processo interpreta o dado e decide o que fazer." },
            { nome: "Atuador", texto: "Os atuadores são acionados automaticamente ou a informação segue para um painel de monitoramento remoto." }
        ];

        const INTERVALO = 1300;
        let timers = [];

        function reiniciar() {
            timers.forEach(clearTimeout);
            timers = [];
            nos.forEach(function (n) {
                n.classList.remove("on");
                n.querySelector(".node").classList.remove("active");
            });
            linhas.forEach(function (l) { l.classList.remove("on"); });
        }

        botaoSim.addEventListener("click", function () {
            reiniciar();
            botaoSim.disabled = true;
            botaoSim.textContent = "Simulando...";

            etapas.forEach(function (etapa, i) {
                timers.push(setTimeout(function () {
                    if (i > 0) linhas[i - 1].classList.add("on");
                    nos[i].classList.add("on");
                    nos[i].querySelector(".node").classList.add("active");
                    saida.innerHTML = "<strong>&gt; " + etapa.nome + "</strong><br>" + etapa.texto;

                    if (i === etapas.length - 1) {
                        botaoSim.disabled = false;
                        botaoSim.textContent = "Simular de novo";
                    }
                }, i * INTERVALO));
            });
        });
    }
});
