/* =========================================================
   Quiz SAEP — quiz.js
   Mostra uma questão por vez, corrige ao confirmar,
   explica a resposta e mostra o resultado por tema.
   ========================================================= */
document.addEventListener("DOMContentLoaded", function () {
    const lista = document.getElementById("quizLista");
    if (!lista) return;

    const questoes = Array.from(lista.querySelectorAll(".quiz-q"));
    const total = questoes.length;
    const textoProgresso = document.getElementById("quizProgressoTexto");
    const placar = document.getElementById("quizPlacar");
    const barra = document.getElementById("quizBar");
    const barraFill = document.getElementById("quizBarFill");
    const resultado = document.getElementById("quizResultado");
    const status = document.getElementById("quizStatus");

    let atual = 0;
    let acertos = 0;
    const respostas = []; // { tema, rotulo, href, ok }

    function esc(t) {
        return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function mostrar(i) {
        questoes.forEach(function (q, k) { q.hidden = k !== i; });
        atual = i;
        textoProgresso.textContent = "Questão " + (i + 1) + " de " + total;
        placar.textContent = "Acertos: " + acertos;
        const feitas = respostas.length;
        barra.setAttribute("aria-valuenow", String(feitas));
        barraFill.style.width = (feitas / total * 100) + "%";
        questoes[i].scrollIntoView({ block: "start" });
    }

    questoes.forEach(function (q, i) {
        const opcoes = q.querySelectorAll(".quiz-opt");
        const radios = q.querySelectorAll("input[type=radio]");
        const confirmar = q.querySelector(".quiz-confirmar");
        const proxima = q.querySelector(".quiz-proxima");
        const feedback = q.querySelector(".quiz-feedback");
        const veredito = q.querySelector(".quiz-veredito");
        const correta = q.getAttribute("data-correta");

        radios.forEach(function (r) {
            r.addEventListener("change", function () {
                opcoes.forEach(function (o) { o.classList.remove("selecionada"); });
                r.closest(".quiz-opt").classList.add("selecionada");
                confirmar.disabled = false;
            });
        });

        confirmar.addEventListener("click", function () {
            const marcada = q.querySelector("input[type=radio]:checked");
            if (!marcada) return;
            const ok = marcada.value === correta;
            if (ok) acertos++;

            radios.forEach(function (r) {
                r.disabled = true;
                const op = r.closest(".quiz-opt");
                if (r.value === correta) op.classList.add("certa");
                else if (r === marcada) op.classList.add("errada");
            });

            veredito.className = "quiz-veredito " + (ok ? "ok" : "erro");
            veredito.innerHTML = ok
                ? '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Correto!'
                : '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i> Resposta incorreta. A alternativa certa é a <strong>' + correta.toUpperCase() + "</strong>.";
            feedback.hidden = false;
            confirmar.hidden = true;
            proxima.hidden = false;
            proxima.focus();

            respostas.push({
                tema: q.getAttribute("data-tema"),
                rotulo: q.getAttribute("data-rotulo"),
                href: q.getAttribute("data-revisar"),
                n: i + 1,
                ok: ok
            });
            placar.textContent = "Acertos: " + acertos;
            barra.setAttribute("aria-valuenow", String(respostas.length));
            barraFill.style.width = (respostas.length / total * 100) + "%";
        });

        proxima.addEventListener("click", function () {
            if (i + 1 < total) mostrar(i + 1);
            else fim();
        });
    });

    function fim() {
        questoes.forEach(function (q) { q.hidden = true; });
        status.hidden = true;

        const pct = Math.round(acertos / total * 100);
        let msg = "Continue estudando: revise os conteúdos indicados e tente de novo.";
        if (pct >= 80) msg = "Excelente! Você domina bem o conteúdo.";
        else if (pct >= 60) msg = "Bom resultado! Revise os pontos abaixo para chegar ainda mais longe.";

        // desempenho por tema
        const temas = {};
        respostas.forEach(function (r) {
            if (!temas[r.tema]) temas[r.tema] = { ok: 0, total: 0 };
            temas[r.tema].total++;
            if (r.ok) temas[r.tema].ok++;
        });
        let linhasTema = "";
        Object.keys(temas).forEach(function (t) {
            linhasTema += "<li><span>" + esc(t) + "</span><strong>" + temas[t].ok + "/" + temas[t].total + "</strong></li>";
        });

        // revisão das erradas
        const erradas = respostas.filter(function (r) { return !r.ok; });
        let revisao = "";
        if (erradas.length) {
            revisao = '<h3>Onde revisar</h3><ul class="quiz-revisar">';
            erradas.forEach(function (r) {
                revisao += '<li>Questão ' + r.n + ' — <a href="' + r.href + '">' + esc(r.rotulo) + "</a></li>";
            });
            revisao += "</ul>";
        } else {
            revisao = "<p class=\"explanation\">Você acertou todas as questões. Nenhuma revisão necessária.</p>";
        }

        resultado.innerHTML =
            '<div class="quiz-nota"><span class="quiz-nota-num">' + acertos + "/" + total + '</span><span class="quiz-nota-pct">' + pct + "% de acertos</span></div>" +
            '<p class="explanation">' + msg + "</p>" +
            "<h3>Desempenho por tema</h3><ul class=\"quiz-temas\">" + linhasTema + "</ul>" +
            revisao +
            '<div class="btn-row"><button class="btn" type="button" id="quizRefazer"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i>Refazer o simulado</button></div>';
        resultado.hidden = false;
        resultado.scrollIntoView({ block: "start" });

        document.getElementById("quizRefazer").addEventListener("click", reiniciar);
    }

    function reiniciar() {
        acertos = 0;
        respostas.length = 0;
        resultado.hidden = true;
        status.hidden = false;
        questoes.forEach(function (q) {
            q.querySelectorAll("input[type=radio]").forEach(function (r) { r.checked = false; r.disabled = false; });
            q.querySelectorAll(".quiz-opt").forEach(function (o) { o.classList.remove("selecionada", "certa", "errada"); });
            q.querySelector(".quiz-feedback").hidden = true;
            q.querySelector(".quiz-confirmar").hidden = false;
            q.querySelector(".quiz-confirmar").disabled = true;
            q.querySelector(".quiz-proxima").hidden = true;
        });
        mostrar(0);
    }

    // colorização do código dentro do quiz (mesmo tokenizador do site, se existir)
    // main.js só colore .firmware-section code no carregamento; aqui reaproveitamos a classe.
    mostrar(0);
});
