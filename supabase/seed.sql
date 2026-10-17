-- ==============================================================================
-- QR HEALTH VAULT - DEMO SEED DATA
-- Patient: Ramesh Sharma (62M, Diabetic, Penicillin Allergy, Blood Group B+)
-- ==============================================================================

DO $$
DECLARE
    v_user_id UUID := '00000000-0000-0000-0000-000000000001';
    v_doc_lab1 UUID := '11111111-1111-1111-1111-111111111101';
    v_doc_lab2 UUID := '11111111-1111-1111-1111-111111111102';
    v_doc_lab3 UUID := '11111111-1111-1111-1111-111111111103';
    v_doc_rx1 UUID := '22222222-2222-2222-2222-222222222201';
    v_doc_rx2 UUID := '22222222-2222-2222-2222-222222222202';
    v_full_token_id UUID := '33333333-3333-3333-3333-333333333301';
    v_emerg_token_id UUID := '33333333-3333-3333-3333-333333333302';
BEGIN
    -- 1. Insert Profile
    INSERT INTO profiles (
        id, phone, full_name, age, gender, blood_group,
        allergies, chronic_conditions, preferred_language
    ) VALUES (
        v_user_id,
        '+919876543210',
        'Ramesh Sharma',
        62,
        'Male',
        'B+',
        ARRAY['Penicillin', 'Sulfa drugs'],
        ARRAY['Type 2 Diabetes Mellitus', 'Hypertension'],
        'hi'
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        blood_group = EXCLUDED.blood_group,
        allergies = EXCLUDED.allergies,
        chronic_conditions = EXCLUDED.chronic_conditions;

    -- 2. Emergency Contacts
    DELETE FROM emergency_contacts WHERE patient_id = v_user_id;
    INSERT INTO emergency_contacts (patient_id, name, relationship, phone, is_primary)
    VALUES
        (v_user_id, 'Pooja Sharma (Daughter)', 'Daughter', '+919811122233', true),
        (v_user_id, 'Dr. Arvind Verma (Family Physician)', 'Doctor', '+919822233344', false);

    -- 3. Documents (3 Lab Reports over 6 months + 2 Prescriptions)
    DELETE FROM documents WHERE patient_id = v_user_id;

    -- Lab 1 (6 months ago - Initial high blood sugar & HbA1c)
    INSERT INTO documents (
        id, patient_id, type, file_name, file_path, file_hash, mime_type, size_bytes, status, uploaded_at
    ) VALUES (
        v_doc_lab1, v_user_id, 'lab_report', 'Metropolis_HBA1C_Apr2026.pdf',
        'demo/metropolis_apr2026.pdf', 'hash_seed_lab_1_apr2026', 'application/pdf', 104200, 'ready',
        NOW() - INTERVAL '180 days'
    );

    -- Lab 2 (3 months ago - Follow up, slight improvement)
    INSERT INTO documents (
        id, patient_id, type, file_name, file_path, file_hash, mime_type, size_bytes, status, uploaded_at
    ) VALUES (
        v_doc_lab2, v_user_id, 'lab_report', 'Apollo_Lipid_Sugar_Jul2026.pdf',
        'demo/apollo_jul2026.pdf', 'hash_seed_lab_2_jul2026', 'application/pdf', 142300, 'ready',
        NOW() - INTERVAL '90 days'
    );

    -- Lab 3 (2 weeks ago - Recent comprehensive panel)
    INSERT INTO documents (
        id, patient_id, type, file_name, file_path, file_hash, mime_type, size_bytes, status, uploaded_at
    ) VALUES (
        v_doc_lab3, v_user_id, 'lab_report', 'LalPath_Complete_Oct2026.pdf',
        'demo/lalpath_oct2026.pdf', 'hash_seed_lab_3_oct2026', 'application/pdf', 198000, 'ready',
        NOW() - INTERVAL '14 days'
    );

    -- Prescription 1 (3 months ago - Past)
    INSERT INTO documents (
        id, patient_id, type, file_name, file_path, file_hash, mime_type, size_bytes, status, uploaded_at
    ) VALUES (
        v_doc_rx1, v_user_id, 'prescription', 'Rx_DrKapoor_Cardiology_Jul2026.jpg',
        'demo/rx_jul2026.jpg', 'hash_seed_rx_1_jul2026', 'image/jpeg', 245000, 'ready',
        NOW() - INTERVAL '90 days'
    );

    -- Prescription 2 (Recent - Active ongoing medicines)
    INSERT INTO documents (
        id, patient_id, type, file_name, file_path, file_hash, mime_type, size_bytes, status, uploaded_at
    ) VALUES (
        v_doc_rx2, v_user_id, 'prescription', 'Rx_DrVerma_Endocrine_Oct2026.jpg',
        'demo/rx_oct2026.jpg', 'hash_seed_rx_2_oct2026', 'image/jpeg', 312000, 'ready',
        NOW() - INTERVAL '10 days'
    );

    -- 4. Lab Results (For trend graphs: Fasting Blood Sugar, HbA1c, Systolic BP, Total Cholesterol)
    DELETE FROM lab_results WHERE patient_id = v_user_id;

    -- Results for Lab 1 (6 months ago)
    INSERT INTO lab_results (document_id, patient_id, test_name, value, unit, normal_min, normal_max, flag, confidence, confirmed, created_at)
    VALUES
        (v_doc_lab1, v_user_id, 'Fasting Blood Sugar', 188.0, 'mg/dL', 70.0, 99.0, 'high', 0.98, true, NOW() - INTERVAL '180 days'),
        (v_doc_lab1, v_user_id, 'HbA1c', 8.8, '%', 4.0, 5.6, 'high', 0.99, true, NOW() - INTERVAL '180 days'),
        (v_doc_lab1, v_user_id, 'Total Cholesterol', 235.0, 'mg/dL', 125.0, 200.0, 'high', 0.96, true, NOW() - INTERVAL '180 days'),
        (v_doc_lab1, v_user_id, 'Hemoglobin', 13.8, 'g/dL', 13.0, 17.0, 'normal', 0.98, true, NOW() - INTERVAL '180 days');

    -- Results for Lab 2 (3 months ago)
    INSERT INTO lab_results (document_id, patient_id, test_name, value, unit, normal_min, normal_max, flag, confidence, confirmed, created_at)
    VALUES
        (v_doc_lab2, v_user_id, 'Fasting Blood Sugar', 152.0, 'mg/dL', 70.0, 99.0, 'high', 0.97, true, NOW() - INTERVAL '90 days'),
        (v_doc_lab2, v_user_id, 'HbA1c', 7.9, '%', 4.0, 5.6, 'high', 0.98, true, NOW() - INTERVAL '90 days'),
        (v_doc_lab2, v_user_id, 'Total Cholesterol', 210.0, 'mg/dL', 125.0, 200.0, 'high', 0.95, true, NOW() - INTERVAL '90 days'),
        (v_doc_lab2, v_user_id, 'Hemoglobin', 14.1, 'g/dL', 13.0, 17.0, 'normal', 0.99, true, NOW() - INTERVAL '90 days');

    -- Results for Lab 3 (Recent - 14 days ago)
    INSERT INTO lab_results (document_id, patient_id, test_name, value, unit, normal_min, normal_max, flag, confidence, confirmed, created_at)
    VALUES
        (v_doc_lab3, v_user_id, 'Fasting Blood Sugar', 128.0, 'mg/dL', 70.0, 99.0, 'high', 0.99, true, NOW() - INTERVAL '14 days'),
        (v_doc_lab3, v_user_id, 'HbA1c', 7.2, '%', 4.0, 5.6, 'high', 0.99, true, NOW() - INTERVAL '14 days'),
        (v_doc_lab3, v_user_id, 'Total Cholesterol', 185.0, 'mg/dL', 125.0, 200.0, 'normal', 0.97, true, NOW() - INTERVAL '14 days'),
        (v_doc_lab3, v_user_id, 'Serum Creatinine', 1.05, 'mg/dL', 0.7, 1.3, 'normal', 0.98, true, NOW() - INTERVAL '14 days'),
        (v_doc_lab3, v_user_id, 'Hemoglobin', 14.2, 'g/dL', 13.0, 17.0, 'normal', 0.99, true, NOW() - INTERVAL '14 days');

    -- 5. Medicines (Active and Past)
    DELETE FROM medicines WHERE patient_id = v_user_id;

    -- Past antibiotic course (ended)
    INSERT INTO medicines (
        document_id, patient_id, name, dose, frequency, duration_days, start_date, end_date, instructions, confidence, confirmed
    ) VALUES (
        v_doc_rx1, v_user_id, 'Azithromycin', '500mg', 'Once daily', 5,
        CURRENT_DATE - INTERVAL '85 days', CURRENT_DATE - INTERVAL '80 days',
        'Take after lunch for 5 days only', 0.98, true
    );

    -- Active ongoing medicines
    INSERT INTO medicines (
        document_id, patient_id, name, dose, frequency, duration_days, start_date, end_date, instructions, confidence, confirmed
    ) VALUES
        (v_doc_rx2, v_user_id, 'Metformin (Glycomet SR)', '500mg', 'Twice daily', 90,
         CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days',
         'Take with meals morning and night', 0.99, true),
        (v_doc_rx2, v_user_id, 'Telmisartan (Telma)', '40mg', 'Once daily', 90,
         CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days',
         'Take empty stomach in the morning', 0.97, true),
        (v_doc_rx2, v_user_id, 'Atorvastatin (Atorva)', '10mg', 'Once daily at bedtime', 90,
         CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days',
         'Night after dinner', 0.99, true);

    -- 6. QR Tokens
    DELETE FROM qr_tokens WHERE patient_id = v_user_id;
    INSERT INTO qr_tokens (id, patient_id, token, type, active)
    VALUES
        (v_full_token_id, v_user_id, 'demo_doctor_vault_token_987654', 'full', true),
        (v_emerg_token_id, v_user_id, 'demo_emergency_token_123456', 'emergency', true);

    -- 7. Sample Access Requests & Logs
    DELETE FROM access_requests WHERE patient_id = v_user_id;
    INSERT INTO access_requests (
        patient_id, token_id, requester_label, doctor_ip_hash, status, duration_hours, approved_at, expires_at
    ) VALUES (
        v_user_id, v_full_token_id, 'Apollo Emergency Dept (Dr. Mehta)',
        'hash_doc_ip_99', 'approved', 24, NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours'
    );

    DELETE FROM access_logs WHERE patient_id = v_user_id;
    INSERT INTO access_logs (patient_id, access_type, requester_label, ip_hash, user_agent, timestamp)
    VALUES
        (v_user_id, 'emergency_view', 'Lock Screen / Emergency Scan', 'ip_hash_abc_1', 'Mobile Safari 17.4', NOW() - INTERVAL '3 days'),
        (v_user_id, 'doctor_view', 'Apollo Emergency Dept (Dr. Mehta)', 'ip_hash_xyz_2', 'Chrome Desktop 122', NOW() - INTERVAL '2 hours');

    -- 8. AI Multi-lingual Summary
    DELETE FROM ai_summaries WHERE patient_id = v_user_id;
    INSERT INTO ai_summaries (patient_id, language, summary_type, content, disclaimer)
    VALUES
        (v_user_id, 'hi', 'comprehensive_doctor',
         'मरीज रमेश शर्मा (62 वर्ष) टाइप 2 डायबिटीज और हाइपरटेंशन से पीड़ित हैं। पेनिसिलिन से एलर्जी है। पिछले 6 महीनों में HbA1c 8.8% से घटकर 7.2% पर आया है और ब्लड शुगर 188 से 128 mg/dL पर नियंत्रण में आ रहा है। वर्तमान में मेटफॉर्मिन 500mg, टेल्मिसार्टन 40mg और एटोरवास्टेटिन 10mg ले रहे हैं।',
         'This is for understanding only. Please consult your doctor.'),
        (v_user_id, 'en', 'comprehensive_doctor',
         'Patient Ramesh Sharma (62M) has Type 2 Diabetes and Hypertension, with a confirmed Penicillin allergy. Over the past 6 months, glycemic control has steadily improved with HbA1c decreasing from 8.8% to 7.2% and fasting glucose from 188 to 128 mg/dL. Current regular medications include Metformin 500mg BID, Telmisartan 40mg OD, and Atorvastatin 10mg HS.',
         'This is for understanding only. Please consult your doctor.');
END $$;
