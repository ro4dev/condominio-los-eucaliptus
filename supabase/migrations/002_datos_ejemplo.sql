-- ============================================
-- Condominio Eucaliptus - Datos de ejemplo
-- ============================================

-- PARCELAS
INSERT INTO parcelas (numero, rol, metros, estado) VALUES
('Parcela 1', '00521-001', 450, 'Habitada'),
('Parcela 2', '00521-002', 520, 'Habitada'),
('Parcela 3', '00521-003', 380, 'Habitada'),
('Parcela 4', '00521-004', 600, 'Desocupada'),
('Parcela 5', '00521-005', 410, 'Habitada'),
('Parcela 6', '00521-006', 480, 'En construcción'),
('Parcela 7', '00521-007', 530, 'Habitada'),
('Parcela 8', '00521-008', 420, 'Habitada');

-- PROPIETARIOS
INSERT INTO propietarios (nombre_completo, rut, parcela_id, telefono, email, tipo) VALUES
('Juan Pérez', '30123456', (SELECT id FROM parcelas WHERE numero = 'Parcela 1'), '+54 9 11 1234-5678', 'juan.perez@mail.com', 'Propietario'),
('María García', '27654321', (SELECT id FROM parcelas WHERE numero = 'Parcela 1'), '+54 9 11 1234-9999', 'maria.garcia@mail.com', 'Inquilino'),
('Carlos López', '32123456', (SELECT id FROM parcelas WHERE numero = 'Parcela 2'), '+54 9 11 5555-1111', 'carlos.lopez@mail.com', 'Propietario'),
('Ana Martínez', '28987654', (SELECT id FROM parcelas WHERE numero = 'Parcela 3'), '+54 9 11 5555-2222', 'ana.martinez@mail.com', 'Propietario'),
('Roberto Sánchez', '31567890', (SELECT id FROM parcelas WHERE numero = 'Parcela 5'), '+54 9 11 6666-3333', 'roberto.sanchez@mail.com', 'Propietario'),
('Laura Fernández', '29123456', (SELECT id FROM parcelas WHERE numero = 'Parcela 7'), '+54 9 11 7777-4444', 'laura.fernandez@mail.com', 'Propietario'),
('Pedro González', '33456789', (SELECT id FROM parcelas WHERE numero = 'Parcela 8'), '+54 9 11 8888-5555', 'pedro.gonzalez@mail.com', 'Propietario');

-- GASTOS COMUNES
INSERT INTO gastos (parcela, periodo, concepto, monto, descripcion, pagado) VALUES
('Parcela 6', '2026-07', 'Gasto común', 50000, 'Mensualidad julio', 'Sí'),
('Parcela 1', '2026-07', 'Gasto común', 50000, 'Pago Juan Pérez', 'Sí'),
('Parcela 2', '2026-07', 'Gasto común', 50000, 'Pago Carlos López', 'Sí'),
('Parcela 3', '2026-07', 'Gasto común', 50000, 'Pendiente', 'No'),
('Parcela 1', '2026-06', 'Gasto común', 45000, 'Pago junio', 'Sí'),
('Parcela 2', '2026-06', 'Gasto común', 45000, 'Pago junio', 'Sí');

-- INGRESOS/EGRESOS
INSERT INTO flujo (fecha, tipo, concepto, monto, descripcion, comprobante, registrado_por) VALUES
('2026-07-01', 'Ingreso', 'Cuotas', 650000, 'Cobro expensas julio', NULL, 'Admin'),
('2026-07-03', 'Ingreso', 'Cuotas', 50000, 'Pago Juan Pérez', NULL, 'Admin'),
('2026-07-05', 'Egreso', 'Mantenimiento', 120000, 'Reparación pileta', NULL, 'Admin'),
('2026-07-10', 'Egreso', 'Servicios', 85000, 'Electricidad común julio', NULL, 'Admin'),
('2026-06-01', 'Ingreso', 'Cuotas', 600000, 'Cobro expensas junio', NULL, 'Admin'),
('2026-06-15', 'Egreso', 'Seguridad', 150000, 'Pago seguridad junio', NULL, 'Admin');

-- NOTICIAS
INSERT INTO noticias (titulo, descripcion, fecha_hasta) VALUES
('Asamblea mensual', 'Se realiza el viernes 25 a las 19hs en el salón común. Temas: presupuesto, mantenimiento y nuevos proyectos.', '2026-07-25'),
('Corte de agua programado', 'El martes 22 de julio no habrá agua de 8 a 16hs por trabajos en la red principal.', '2026-07-22'),
('Nueva seguridad nocturna', 'Se implementa sistema de cámaras y警卫 nocturno a partir del 1 de agosto.', '2026-08-15');

-- DOCUMENTOS
INSERT INTO documentos (nombre, categoria, descripcion) VALUES
('Reglamento interno 2026', 'Estatuto', 'Reglamento aprobado en asamblea ordinaria'),
('Acta asamblea junio 2026', 'Actas', 'Acta de la asamblea mensual de junio'),
('Contrato mantenimiento', 'Contratos', 'Contrato anual con empresa de mantenimiento'),
('Seguro edificio', 'Seguros', 'Póliza de seguro contra incendio y robo');

-- RECLAMOS
INSERT INTO reclamos (tipo, parcela_id, asunto, descripcion) VALUES
('Reclamo', (SELECT id FROM parcelas WHERE numero = 'Parcela 3'), 'Fuga de agua en zona común', 'Se está filtrando agua cerca del tanque de reserva. El caño parece viejo.'),
('Sugerencia', NULL, 'Mejorar iluminación del camino', 'Sería bueno colocar luces LED en todo el camino principal.'),
('Reclamo', (SELECT id FROM parcelas WHERE numero = 'Parcela 5'), 'Ruido excesivo nocturno', 'Los vecinos de al lado hacen fiesta todos los fines de semana hasta tarde.');

-- PROVEEDORES
INSERT INTO proveedores (rubro, nombre, telefono, email, contacto, observaciones) VALUES
('Plomería', 'Agua & Sol', '+54 9 11 5555-1111', 'contacto@aguasol.com', 'Roberto', 'Trabaja lunes a viernes 8-18'),
('Electricidad', 'Electro Barrio', '+54 9 11 5555-2222', 'info@electrobarrio.com', 'Martín', 'Emergencias 24hs'),
('Jardinería', 'Verde Total', '+54 9 11 5555-3333', 'contacto@verdetotal.com', 'Laura', 'Mantenimiento quincenal'),
('Seguridad', 'SafeGuard', '+54 9 11 5555-4444', 'info@safeguard.com', 'Carlos', 'Monitoreo 24/7');

-- ASAMBLEAS
INSERT INTO asambleas (fecha, tipo, temario, acuerdos, asistentes) VALUES
('2026-06-15', 'Ordinaria', '1. Presupuesto trimestral\n2. Mantenimiento pileta\n3. Seguridad nocturna\n4. Preguntas varias', 'Se aprobó presupuesto $2.500.000. Se reparará pileta. Se instalarán cámaras.', 'Parcela 1, Parcela 2, Parcela 3, Parcela 4, Parcela 5, Parcela 6'),
('2026-07-20', 'Ordinaria', '1. Revisión gastos junio-julio\n2. Reparación bomba agua\n3. Próximos proyectos\n4. Preguntas varias', 'Se revisaron gastos. Se aprobó reparación bomba $35.000. Se propuso jardín común.', 'Parcela 1, Parcela 2, Parcela 3, Parcela 5, Parcela 7');
