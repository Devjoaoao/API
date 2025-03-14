document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.querySelector('input[name="name"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;

    if (!name || !email || !password) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch('https://macademy-api-nj20.onrender.com/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const result = await response.json();
        console.log("Resposta do servidor:", result);

        if (response.ok) {
            alert("Usuário registrado com sucesso!");
            window.location.href = "/login.html"; // Redireciona para a página de login
        } else {
            alert(result.message || "Erro ao registrar usuário.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor.");
    }
});