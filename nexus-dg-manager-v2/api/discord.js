// api/discord.js
const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responder ao preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas POST é permitido
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Pegar os dados do corpo da requisição
        const { tamer, selected, pending, date, time, completed, total, pendingCount, image } = req.body;

        // Validar dados
        if (!tamer || !selected || !image) {
            return res.status(400).json({ error: 'Dados incompletos. Verifique todos os campos.' });
        }

        // Pegar a URL do webhook das variáveis de ambiente
        const webhookURL = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookURL) {
            console.error('DISCORD_WEBHOOK_URL não configurada');
            return res.status(500).json({ error: 'Webhook não configurado no servidor.' });
        }

        // Calcular progresso
        const progress = Math.round((completed / total) * 100);

        // Construir o embed para o Discord
        const embed = {
            title: `📊 Relatório de DGs - ${tamer}`,
            color: 0x00d4ff,
            fields: [
                {
                    name: '✅ DGs Concluídas',
                    value: selected.length > 0 ? selected.map(dg => `• ${dg}`).join('\n') : 'Nenhuma',
                    inline: true
                },
                {
                    name: '❌ DGs Pendentes',
                    value: pending.length > 0 ? pending.map(dg => `• ${dg}`).join('\n') : '🎉 Todas concluídas!',
                    inline: true
                },
                {
                    name: '📈 Progresso',
                    value: `${completed}/${total} DGs (${progress}%)`,
                    inline: false
                },
                {
                    name: '🕐 Data/Hora',
                    value: `${date} • ${time}`,
                    inline: false
                }
            ],
            footer: {
                text: 'Nexus Guild • Digimon Masters Online',
                icon_url: 'https://via.placeholder.com/32/00d4ff/ffffff?text=N'
            },
            timestamp: new Date().toISOString()
        };

        // Payload do Discord
        const payload = {
            content: `📢 **${tamer}** registrou suas DGs diárias!`,
            embeds: [embed]
        };

        // Criar form data para enviar a imagem
        const form = new FormData();
        form.append('payload_json', JSON.stringify(payload));
        
        // Converter base64 para buffer e anexar
        const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
        form.append('file', imageBuffer, {
            filename: `nexus-dg-${tamer}-${Date.now()}.png`,
            contentType: 'image/png'
        });

        // Enviar para o Discord
        const response = await fetch(webhookURL, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro no Discord:', errorText);
            
            if (response.status === 429) {
                return res.status(429).json({ 
                    error: 'Muitas requisições. Aguarde um momento.' 
                });
            }
            
            throw new Error(`Erro no Discord: ${response.status}`);
        }

        // Sucesso!
        return res.status(200).json({ 
            success: true, 
            message: 'Relatório enviado com sucesso!',
            data: { tamer, completed, total }
        });

    } catch (error) {
        console.error('Erro na função:', error);
        return res.status(500).json({ 
            error: 'Erro interno ao processar a requisição.',
            details: error.message 
        });
    }
};