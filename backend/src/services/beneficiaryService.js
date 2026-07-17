const pool = require('../config/db');

const processAdulthoodTransition = async (cedulaBeneficiario, cedulaTitular) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Obtener la fecha de nacimiento desde la entidad fuerte Beneficiario
        const { rows } = await client.query(`
            SELECT b.fecha_nacimiento 
            FROM Beneficiario b
            JOIN Carga_menor c ON b.cedula_beneficiario = c.cedula_beneficiario
            WHERE b.cedula_beneficiario = $1 AND b.cedula_titular = $2
        `, [cedulaBeneficiario, cedulaTitular]);

        // Si no existe o no es carga menor, ignoramos
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return false; 
        }

        const fechaNacimiento = new Date(rows[0].fecha_nacimiento);
        const age = Math.floor((new Date() - fechaNacimiento) / 31557600000);

        if (age >= 18) {
            // 2. Eliminar de Carga_menor
            await client.query(`
                DELETE FROM Carga_menor 
                WHERE cedula_beneficiario = $1
            `, [cedulaBeneficiario]);

            // 3. Insertar en Carga_mayor (los documentos quedan nulos para exigir su subida)
            await client.query(`
                INSERT INTO Carga_mayor (cedula_beneficiario, constancia_estudios, certificado_solteria)
                VALUES ($1, NULL, NULL)
            `, [cedulaBeneficiario]);

            // 4. Inhabilitar los beneficios hasta que suban los documentos
            await client.query(`
                UPDATE Beneficiario 
                SET beneficios_activos = FALSE 
                WHERE cedula_beneficiario = $1
            `, [cedulaBeneficiario]);
        }

        await client.query('COMMIT');
        return age >= 18; // Retorna true si ocurrió la migración
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[BeneficiaryService] Error en transición de mayoría de edad:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { processAdulthoodTransition };