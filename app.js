document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.querySelector('input[name="name"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;

    const userData = { name, email, password };

    try {
        const response = await fetch('https://macademy-api-nj20.onrender.com/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        console.log("Resposta do servidor:", result);

        if (response.ok) {
            alert("Usuário registrado com sucesso!");
            window.location.href = "/login.html";
        } else {
            alert(result.message || "Erro ao registrar usuário.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor.");
    }
});