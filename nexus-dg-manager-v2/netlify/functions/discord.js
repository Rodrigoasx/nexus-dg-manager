const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    try {
        // Parse request
        const { tamer, selected, pending, date, time, completed, total, pendingCount, image } = JSON.parse(event.body);

        // Validate required fields
        if (!tamer || !selected || !image) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Dados incompletos. Verifique todos os campos.' })
            };
        }

        // Get webhook URL
        const webhookURL = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookURL) {
            console.error('DISCORD_WEBHOOK_URL not configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Webhook não configurado no servidor.' })
            };
        }

        // Calculate progress
        const progress = Math.round((completed / total) * 100);

        // Build embed
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
            timestamp: new Date().toISOString(),
            thumbnail: {
                url: 'https://via.placeholder.com/128/00d4ff/ffffff?text=NEXUS'
            }
        };

        // Build payload
        const payload = {
            content: `📢 **${tamer}** registrou suas DGs diárias!`,
            embeds: [embed]
        };

        // Create form data
        const form = new FormData();
        form.append('payload_json', JSON.stringify(payload));
        
        // Convert base64 to buffer and attach
        const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
        form.append('file', imageBuffer, {
            filename: `nexus-dg-${tamer}-${Date.now()}.png`,
            contentType: 'image/png'
        });

        // Send to Discord
        const response = await fetch(webhookURL, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Discord API error:', errorText);
            
            if (response.status === 429) {
                return {
                    statusCode: 429,
                    headers,
                    body: JSON.stringify({ error: 'Muitas requisições. Aguarde um momento.' })
                };
            }
            
            throw new Error(`Discord API error: ${response.status}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Relatório enviado com sucesso!',
                data: { tamer, completed, total }
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Erro interno ao processar a requisição.',
                details: error.message 
            })
        };
    }
};