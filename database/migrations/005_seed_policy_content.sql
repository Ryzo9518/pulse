-- 005_seed_policy_content.sql
-- Loads policy icon/summary/full_text for the canonical 24 policies. The base
-- seed (003) inserts policy metadata only; this fills in the body text so the
-- live Policies screen renders real content. Idempotent: id-keyed UPDATEs.
-- GENERATED from frontend/lib/mock/policies.ts by scripts/gen-policy-content.ts
-- — edit the source policies, not this file.
begin;
update hr_policies set icon='⚖️', summary='This Code of Ethics outlines the principles and values that guide the conduct of all members of Jera Consulting (Pty) Ltd, including directors, man…', full_text='1. Introduction
This Code of Ethics outlines the principles and values that guide the conduct of all members of Jera Consulting (Pty) Ltd, including directors, managers, and employees. In a dynamic business environment, ethical conduct remains fundamental to our success and reputation.
2. Scope
This policy applies to all employees, contractors, directors, and representatives of Jera Consulting. It is binding on all individuals conducting business on behalf of the company.
3. Core Values
Jera Consulting is built on five core values that underpin all business decisions and employee conduct:
Client Orientation: We prioritise client needs and deliver exceptional service with integrity.
Competency: We maintain high standards of professional expertise and continuous development.
Teamwork: We collaborate effectively and support one another in achieving shared objectives.
Fairness: We treat all stakeholders with respect, equality, and impartiality.
Integrity: We act honestly, transparently, and ethically in all business dealings.
4. Ethical Principles
4.1 Honesty and Integrity
All employees must conduct business with honesty and integrity. Misleading statements, deception, or dishonest conduct will not be tolerated. Employees must:
Provide accurate information in all communications and transactions.
Honour commitments made to clients, colleagues, and suppliers.
Avoid conflicts of interest or declare them immediately.
4.2 Respect and Fairness
We are committed to treating all individuals with respect and dignity. This includes:
Respecting the rights and dignity of all employees regardless of race, gender, age, disability, religion, or sexual orientation.
Fostering an inclusive workplace free from discrimination and harassment.
Complying with employment equity legislation and B-BBEE objectives.
4.3 Confidentiality and Data Protection
All confidential information must be protected. Employees must:
Maintain strict confidentiality of client and company information.
Comply with the Protection of Personal Information Act (POPIA) in handling personal data.
Not disclose confidential information without proper authorisation.
Secure all documentation containing sensitive information.
4.4 Compliance with Law
All employees must comply with applicable laws and regulations, including:
The Prevention and Combating of Corrupt Activities Act (anti-corruption obligations).
The Protected Disclosures Act (whistleblowing protections).
Employment Equity Act and B-BBEE scorecard requirements.
All other applicable legislation.
4.5 Anti-Corruption
Jera Consulting has zero tolerance for corruption. Employees must:
Never offer, give, or receive bribes or improper advantages.
Declare any offers of inappropriate gifts or inducements.
Report suspected corruption through proper channels.
4.6 Whistleblowing and Protected Disclosures
Employees are protected when reporting unethical conduct or legal violations. This includes:
Protection under the Protected Disclosures Act for good faith reporting.
Multiple channels for reporting misconduct (manager, HR, or confidential hotline).
No retaliation against employees who make protected disclosures.
5. Duties of Directors and Managers
Directors and managers have specific responsibilities to uphold ethical standards:
Lead by example through ethical conduct and decision-making.
Communicate this Code of Ethics to all employees reporting to them.
Create an environment where ethical conduct is valued and rewarded.
Address unethical behaviour promptly and fairly.
Ensure employment equity and B-BBEE objectives are actively pursued.
Protect confidentiality and comply with POPIA requirements.
Support employees who make protected disclosures.
6. Duties of Employees
All employees must:
Adhere to the principles and values outlined in this Code.
Conduct themselves professionally and ethically.
Report concerns through appropriate channels.
Cooperate in investigations of unethical conduct.
Maintain confidentiality and data protection.
Support diversity and employment equity initiatives.
Seek guidance when uncertain about ethical matters.
7. Creating Awareness
Jera Consulting commits to:
Including Code of Ethics training in induction for all new employees.
Conducting regular training and awareness sessions.
Maintaining open communication about ethical standards.
Making this Code available to all employees.
8. Compliance and Enforcement
Non-compliance with this Code of Ethics may result in disciplinary action up to and including dismissal, depending on the nature and severity of the breach. All employees are subject to investigation if suspected of violating this Code.
9. Policy Adoption
This Code of Ethics was adopted by Jera Consulting effective April 2026 and supersedes all previous versions. Employees are required to acknowledge receipt and understanding of this Code upon employment or when updated.' where id='HR001';
update hr_policies set icon='📏', summary='This Code of Conduct establishes standards for professional behaviour expected of all employees, contractors, and representatives of Jera Consulting.', full_text='1. Introduction
This Code of Conduct establishes standards for professional behaviour expected of all employees, contractors, and representatives of Jera Consulting. It reflects our commitment to maintaining a professional, respectful, and productive workplace.
2. Scope
This policy applies to all employees, contractors, and representatives of Jera Consulting during working hours, at company events, and when conducting company business.
3. General Behaviour
All employees must conduct themselves professionally and respectfully:
Treat all colleagues, clients, and stakeholders with dignity and respect.
Arrive on time for work and scheduled commitments.
Maintain a professional appearance and demeanour.
Behave in a manner that reflects positively on Jera Consulting.
Comply with all company policies and legal requirements.
Refrain from conduct that is abusive, threatening, or offensive.
4. Management Responsibility
Managers have a duty to:
Enforce this Code of Conduct consistently and fairly.
Address misconduct promptly and appropriately.
Model professional behaviour and ethical conduct.
Provide clear expectations and feedback to employees.
Create a safe and respectful working environment.
5. Communication Lines
Employees are expected to:
Communicate respectfully and professionally in all interactions.
Report concerns through appropriate channels (manager, HR, or confidential hotline).
Avoid spreading rumours or unverified information.
Participate constructively in meetings and discussions.
6. Confidentiality
Employees must maintain strict confidentiality of:
Client information and business transactions.
Company financial and operational information.
Employee personal data and performance information.
Trade secrets and proprietary knowledge.
All employees must comply with the Protection of Personal Information Act (POPIA) when handling personal data. Unauthorised disclosure of confidential information may result in disciplinary action.
7. Conflict of Interest
Employees must disclose and manage conflicts of interest:
Declare any personal financial interest in company transactions.
Avoid situations where personal interests conflict with company business.
Disclose relationships with competitors or suppliers.
Seek manager approval before engaging in outside business activities.
8. Collections
Employees making collections for personal or charitable purposes:
Must obtain manager approval in advance.
Must not coerce or pressure colleagues to contribute.
Must keep records and report usage of collected funds.
May not conduct collections during work time in client areas.
9. Visitors
Employee responsibility for visitors includes:
Ensuring visitors sign in and out at reception.
Escorting visitors throughout the premises.
Ensuring confidentiality and security protocols are maintained.
Informing visitors of company rules and safety procedures.
10. Weapons and Dangerous Items
The possession of weapons, firearms, explosives, or dangerous items on company premises is strictly prohibited. This includes:
Firearms, knives, or other weapons.
Explosives or incendiary devices.
Items that could be used as weapons.
Illegal drugs or related paraphernalia.
Violation of this prohibition will result in immediate disciplinary action and may result in dismissal.
11. Political and Religious Rights
Employees have the right to personal political and religious beliefs; however:
Such beliefs must not be imposed on colleagues or clients.
Company time and facilities must not be used for political or religious activities.
Discuss these matters respectfully and only with willing participants.
Maintain professional boundaries in the workplace.
12. Notice Boards
Notice boards are company property used to communicate official information:
Only authorised management may post notices.
Personal notices may be posted only in designated areas with approval.
Defacing or removing official notices is prohibited.
13. Damage or Loss of Property
Employees are responsible for company and personal property:
Report any damage to company property immediately to management.
Report loss or theft of company equipment or materials.
Employees may be held liable for damage caused by negligence or misuse.
Lost or stolen items must be reported to management and, if applicable, law enforcement.
14. Private Work and Moonlighting
Employees engaging in private work must:
Obtain written approval from their manager in advance.
Ensure it does not conflict with company interests or compete with Jera Consulting.
Not use company time, resources, or facilities for private work.
Ensure there is no breach of confidentiality or conflict of interest.
Disclose any such work to management upon request.
15. Social Media Policy
Social media use in the workplace is governed by the following principles:
15.1 Professional Conduct
Maintain professional standards in all social media activity.
Do not post content that is offensive, defamatory, or discriminatory.
Avoid posting while under the influence or in an emotional state.
15.2 Company Confidentiality
Never disclose confidential company, client, or employee information on social media.
Do not post identifiable company information, client names, or business details.
Avoid commenting negatively about the company, clients, or colleagues.
15.3 Company Accounts and Branding
Only authorised personnel may post on official company social media accounts.
Company branding and logos must be used only with approval.
Ensure all official posts are professional and on-brand.
15.4 Personal Social Media
While you own your personal social media accounts, conduct may reflect on Jera Consulting.
Use good judgment and maintain professional standards.
Company may take action if posts damage the company''s reputation or breach confidentiality.
15.5 Digital Security
Protect company information shared via personal devices and accounts.
Use secure passwords and enable two-factor authentication.
Be cautious of phishing attempts and social engineering via social media.
16. Remote Work and Work from Client Sites
Employees working remotely or at client locations must:
16.1 Professional Environment
Maintain a professional workspace that can be visible during video calls.
Ensure adequate lighting, background, and minimal distractions.
Dress professionally for video meetings and client interactions.
16.2 Security and Confidentiality
Secure company devices with passwords and encryption.
Use approved VPN and security tools for company network access.
Ensure confidential documents and information are not visible to household members.
Lock devices when stepping away.
16.3 Communication
Remain available during agreed working hours.
Respond promptly to messages and emails.
Attend scheduled meetings on time via video or phone.
16.4 Client Site Conduct
Comply with client site rules and security protocols.
Respect client confidentiality and workspace policies.
Represent Jera Consulting professionally at all times.
17. Rumour Mongering and Gossip
Spreading rumours or engaging in gossip is prohibited:
Do not spread unverified information about colleagues or the company.
Address concerns through appropriate channels rather than discussing with others.
Avoid participating in conversations that demean or harm others.
Report substantive concerns to management or HR.
18. Policy Enforcement
Violations of this Code of Conduct may result in disciplinary action ranging from verbal warning to dismissal, depending on the severity and circumstances of the breach. Managers have authority to enforce this policy and may investigate suspected violations.
19. Communication and Review
This policy will be communicated to all employees upon employment and when updated. Managers must ensure their teams understand and comply with this Code of Conduct.' where id='HR002';
update hr_policies set icon='💰', summary='The Remuneration Policy aims to attract, retain, and motivate talented employees through fair, competitive, and performance-linked compensation tha…', full_text='1. Objective
The Remuneration Policy aims to attract, retain, and motivate talented employees through fair, competitive, and performance-linked compensation that aligns with Jera Consulting''s strategic objectives and values.
2. Scope
This policy applies to all permanent employees of Jera Consulting (Pty) Ltd. It establishes principles for remuneration at all levels of the organisation.
3. Remuneration Philosophy
Jera Consulting''s remuneration approach is founded on the following principles:
Competitiveness: Total remuneration packages are benchmarked against relevant market data for similar roles.
Performance-linked: Variable remuneration is tied to individual and company performance.
Equity and fairness: Equal pay for work of equal value is maintained in accordance with the Employment Equity Act.
Transparency: Remuneration principles are clearly communicated to employees.
Sustainability: Remuneration levels are sustainable and aligned with business performance.
4. Total Guaranteed Remuneration
Total Guaranteed Remuneration (TGR) comprises:
Basic salary: Core monthly compensation.
Mandatory benefits: Contributions to medical aid, provident fund, and statutory requirements.
Allowances: Where applicable (e.g., travel, housing, communication).
Employees earning below R254,371.67 per annum are subject to the Basic Conditions of Employment Act (BCEA) provisions.
5. Variable Remuneration and Bonus Scheme
5.1 Bonus Eligibility
All permanent employees are eligible for variable remuneration (bonus) based on performance. Bonus is not guaranteed and is contingent on:
Company financial performance and profitability.
Individual performance rating (see Performance Management Policy).
Employment status throughout the performance period.
5.2 Bonus Structure
Variable remuneration is calculated as a percentage of TGR based on performance rating:
Performance Rating 5 (Exceptional): Up to 20% of TGR.
Performance Rating 4 (Exceeds Expectations): Up to 15% of TGR.
Performance Rating 3 (Meets Expectations): Up to 10% of TGR.
Performance Rating 2 (Below Expectations): No bonus payable.
Performance Rating 1 (Does Not Meet): No bonus payable.
Bonus payment is subject to company financial performance and discretionary approval by the Managing Director.
5.3 Bonus Timing
Variable remuneration is paid annually following completion of performance reviews, typically in the fourth quarter or as determined by management.
6. Pay Equity and Equal Remuneration
Jera Consulting is committed to pay equity principles:
Equal pay is provided for work of equal value, as required by the Employment Equity Act.
Remuneration decisions are based on objective criteria: role, responsibility, qualification, and performance.
Remuneration reviews are conducted to identify and address any unexplained pay gaps.
Employees may request a review of their remuneration if they believe it is inequitable.
Any identified pay inequities are addressed through adjustment or explanation.
7. Annual Remuneration Reviews
Remuneration reviews are conducted annually, typically in the fourth quarter, based on:
Individual performance rating and achievement of objectives.
Market data and benchmarking for comparable roles.
Company financial performance and profitability.
Cost of living adjustments and inflation trends.
Employee tenure and career development.
Salary increases are not automatic and are contingent on performance and company financial health. Adjustments are effective from the start of the new financial year.
8. Comparative Benchmarking
Jera Consulting maintains competitiveness through:
Annual market benchmarking against relevant industry and geographic comparators.
Regular review of survey data from recognized HR consulting firms.
Assessment of similar roles in consulting and professional services sectors.
Adjustments to maintain competitive positioning for talent attraction and retention.
9. Performance Management Mechanism
Remuneration is linked to performance through the Balanced Scorecard (BSC) approach. Performance ratings are determined annually and form the basis for bonus calculations. Refer to the Performance Management Policy for detailed assessment criteria.
10. Benefits and Deductions
10.1 Statutory Benefits
Employees are entitled to statutory benefits as required by law:
Unemployment Insurance Fund (UIF) contributions.
Workmen''s Compensation contributions.
Leave entitlements (annual, sick, family responsibility).
10.2 Voluntary Benefits
Subject to legislative requirements and company policy, employees may participate in:
Medical aid schemes (mandatory for qualifying employees).
Provident or pension funds.
Group insurance schemes.
10.3 Payroll Deductions
Lawful deductions may be made from salary for:
Statutory obligations (tax, UIF, pension contributions).
Benefit scheme contributions.
Court orders or legal garnishees.
Loan repayments or advances (with written consent).
11. Pay Transparency
Jera Consulting believes in pay transparency:
Remuneration philosophy and principles are communicated to all employees.
Performance and bonus criteria are clearly explained.
Individual remuneration reviews are conducted confidentially with employees.
Employees may request information about their own remuneration.
12. Termination and Final Payment
Upon termination of employment, the employee receives:
All accrued salary and wages due to the date of termination.
Payment of accrued leave (annual, sick, and other leave as applicable).
Payment of accrued bonus (if earned and payable under this policy).
Any other payments due under contract or law.
Deductions for losses caused by employee misconduct (where lawful).
13. Policy Review and Amendment
This policy is reviewed annually and may be amended based on market conditions, company performance, and legislative changes. Employees will be notified of material amendments.' where id='HR003';
update hr_policies set icon='📊', summary='The Performance Management Policy provides a framework for systematically assessing and developing employee performance.', full_text='1. Objective
The Performance Management Policy provides a framework for systematically assessing and developing employee performance. It aligns individual objectives with company strategy and supports employee growth and motivation.
2. Scope
This policy applies to all permanent employees of Jera Consulting (Pty) Ltd at all levels. Performance management is an ongoing process, not limited to formal reviews.
3. Rationale
Effective performance management:
Clarifies expectations and aligns individual work with strategic objectives.
Identifies strengths and development needs.
Supports employee growth and career development.
Enables fair and consistent evaluation across the organisation.
Drives accountability and results.
Forms the basis for remuneration and recognition decisions.
4. Core Principles
Fairness and objectivity: Assessments are based on clearly defined criteria.
Transparency: Expectations, ratings, and feedback are communicated openly.
Development-focused: Performance management is a tool for growth, not punishment.
Continuous feedback: Feedback is provided regularly, not only at formal reviews.
Alignment: Individual objectives support company strategic goals.
5. Jera Consulting Values
Performance is assessed against alignment with Jera''s core values:
Client Orientation: Prioritises client needs and delivers exceptional service.
Competency: Maintains professional expertise and continuous improvement.
Teamwork: Collaborates effectively and supports colleagues.
Fairness: Treats stakeholders with respect and impartiality.
Integrity: Acts honestly, transparently, and ethically.
6. Balanced Scorecard Approach
Performance is assessed across four balanced perspectives:
6.1 Financial/Business Results
Achievement of business objectives, revenue targets, profitability, and financial performance metrics relevant to the role.
6.2 Client and Stakeholder Satisfaction
Client feedback, satisfaction scores, stakeholder relationships, and service delivery quality.
6.3 Internal Processes and Innovation
Process improvement, efficiency, system compliance, adherence to procedures, and innovation contributions.
6.4 Learning and Growth
Skills development, knowledge acquisition, training participation, certification achievement, and contribution to organisational knowledge.
7. Performance Planning
At the beginning of each performance cycle (typically January), employees work with managers to establish performance objectives:
Objectives are aligned with department and company strategic goals.
Objectives are SMART: Specific, Measurable, Achievable, Relevant, Time-bound.
Individual and behavioural objectives are both considered.
Development needs and learning goals are identified.
A Personal Development Plan (PDP) is created for each employee.
Performance planning documents are completed and signed by employee and manager.
8. Continuous Feedback and Coaching
Performance management is not limited to formal reviews:
Managers provide regular, informal feedback on performance.
Employees are encouraged to seek feedback and guidance.
Performance issues are addressed promptly through coaching and support.
Recognition is given for achievements and positive contributions.
Quarterly check-in meetings may be held to review progress.
9. Formal Performance Review
9.1 Review Schedule
Formal performance reviews are conducted annually, typically in September/October, for the period January to December. Probationary reviews may be conducted at 6 months of employment.
9.2 Review Process
Employee completes self-assessment against planned objectives.
Manager completes performance rating and written evaluation.
Review meeting is conducted with employee to discuss rating and feedback.
Employee may provide written comments or response.
Discussion focuses on achievements, development needs, and future objectives.
9.3 Assessment Components
The review considers:
Achievement of performance objectives.
Demonstration of core values and behaviours.
Competency development and skill level.
Adherence to policies and procedures.
Teamwork and collaboration.
Contribution to company success.
10. Performance Rating Scale
Performance is rated on a five-point scale:
Rating 5: Exceptional (Far Exceeds Expectations)
Consistently exceeds all performance objectives with outstanding results. Demonstrates exceptional behaviour and contributes significantly beyond the role requirements.
Rating 4: Exceeds Expectations
Exceeds most performance objectives and demonstrates strong alignment with company values. Performance is notably above average.
Rating 3: Meets Expectations
Achieves performance objectives and meets role requirements. Performance is satisfactory and meets company standards.
Rating 2: Below Expectations
Does not fully achieve performance objectives. Performance is below acceptable standards in some areas.
Rating 1: Does Not Meet Expectations
Significantly fails to meet performance objectives and role requirements. Performance is unsatisfactory.
11. Performance Improvement Plan
Employees rated 2 or 1 may be placed on a Performance Improvement Plan (PIP):
Clear, measurable improvement objectives are set.
Timeframe for improvement (typically 3-6 months) is specified.
Support and coaching are provided.
Progress is reviewed formally.
Continuation of employment may be contingent on improvement.
12. Personal Development Plan Integration
Each employee has a Personal Development Plan aligned with performance objectives:
Identifies skills and competencies requiring development.
Specifies training, education, or experience opportunities.
Includes mentoring or coaching arrangements.
Sets timelines for development activities.
Is reviewed and updated annually.
13. Appeal Process
Employees may appeal their performance rating if they believe it is unfair or inaccurate:
Appeal must be submitted in writing within 5 working days of receiving the rating.
Appeal should specify the grounds for disagreement.
A senior manager not previously involved reviews the appeal.
Meeting is held with the employee to discuss the appeal.
Final decision is communicated in writing.
Appeal does not prevent action for addressing performance issues.
14. Consequences of Performance Ratings
14.1 Recognition and Rewards
Employees with ratings of 4 or 5 are eligible for:
Higher variable remuneration (bonus).
Recognition and acknowledgement.
Preferential consideration for promotion or advancement.
Leadership development opportunities.
14.2 Performance Issues
Employees with ratings of 1 or 2 may be subject to:
Performance improvement plans and coaching.
Formal disciplinary processes if performance does not improve.
Suspension of bonuses or increases.
Reassignment or role change.
15. Confidentiality and Privacy
Performance information is confidential and is shared only with:
The employee themselves.
Their direct manager.
HR and senior management (on a need-to-know basis).
External parties with employee consent or legal authority.
16. Performance Management and Remuneration
Performance ratings directly influence remuneration decisions:
Bonus payments are determined by performance rating (see Remuneration Policy).
Salary increases are considered based on performance.
Remuneration reviews account for performance achievement.
17. Policy Review
This policy is reviewed annually and may be updated based on company needs and legislative requirements. Employees will be informed of material changes.' where id='HR004';
update hr_policies set icon='🏖️', summary='This Leave Policy outlines the types of leave available to employees, entitlements, and the process for requesting and managing leave.', full_text='1. Introduction
This Leave Policy outlines the types of leave available to employees, entitlements, and the process for requesting and managing leave. The policy complies with the Basic Conditions of Employment Act (BCEA) and other applicable South African legislation.
2. Scope
This policy applies to all permanent employees of Jera Consulting (Pty) Ltd. Contractual employees, interns, and contractors are subject to their specific employment contracts.
3. Annual Leave
3.1 Entitlement
All employees are entitled to a minimum of 21 consecutive calendar days (15 working days) of paid annual leave per annum, in accordance with the BCEA. This entitlement accrues from the date of employment.
3.2 Leave Cycle
The annual leave cycle runs from 1 January to 31 December each year. Employees must use accrued leave during the leave cycle or by 30 June of the following year, unless operational requirements prevent this.
3.3 Granting of Leave
Employees request annual leave in advance through the digital leave management system.
Managers review and approve leave requests considering operational needs.
Annual leave may be taken in one continuous period or in separate periods as mutually agreed.
Management reserves the right to schedule leave if not taken voluntarily.
3.4 Leave During Notice Period
Employees may take accrued annual leave during their notice period of termination. Leave taken must be deducted from accrued leave. Any accrued leave not taken during employment is payable in full at termination.
3.5 Leave Payment
Annual leave is paid at the employee''s ordinary rate of pay including any regular allowances. Leave is paid even if the employee is absent due to illness.
4. Sick Leave
4.1 Entitlement
Employees are entitled to 30 days of paid sick leave per 36-month cycle, as per the BCEA. Sick leave is provided to allow employees to attend to illness or injury.
4.2 Sick Leave Cycle
The sick leave cycle is a rolling 36-month period. Unused sick leave does not accumulate beyond the 36-month cycle and is forfeited at the end of each cycle.
4.3 Medical Certification
Sick leave of 2 or fewer consecutive days may be taken without medical certification.
Sick leave exceeding 2 consecutive days requires medical certification from a registered medical practitioner.
The company may require medical certification for frequent short absences.
An employee may be required to undergo medical examination at company expense.
4.4 Reporting Sick Leave
Employees must notify their manager as soon as possible when unable to report to work due to illness.
Absence must be reported through the digital leave management system or direct contact.
Failure to report absence may be treated as misconduct.
4.5 Verification
The company may verify sick leave through medical examination or other means. Abuse of sick leave may result in disciplinary action.
5. Maternity Leave
5.1 Entitlement
Female employees are entitled to four months of maternity leave, commencing four weeks before the anticipated date of confinement, as per the BCEA.
5.2 Maternity Benefit
Maternity leave may be paid from the company, the Unemployment Insurance Fund (UIF), or a combination, depending on individual circumstances and UIF eligibility.
5.3 Application Process
Employee must provide written notice of pregnancy and anticipated date of confinement.
Notice should be provided at least 4 weeks before anticipated leave commencement.
Medical certification of pregnancy and expected date may be required.
5.4 Return to Work
Employees returning from maternity leave are entitled to return to the same or equivalent position. The company will make reasonable accommodation for lactation breaks upon request.
6. Paternity Leave
6.1 Entitlement
Male employees are entitled to 10 consecutive days of paternity leave upon the birth of a child, in accordance with the Labour Laws Amendment Act 2018.
6.2 Eligibility
Paternity leave applies to the biological father or adoptive parent of the newborn child. The employee must be the primary caregiver during the leave period.
6.3 Application and Timing
Paternity leave must be taken within 10 weeks of the child''s birth.
The employee must provide written notice and birth certificate as proof.
Leave is paid at ordinary rate of pay.
6.4 UIF Benefit
Paternity leave may be supported by UIF maternity benefits if the employee is registered with UIF and meets eligibility requirements.
7. Adoption Leave
7.1 Entitlement
Employees adopting a child are entitled to 10 consecutive days of paid adoption leave to allow for bonding and finalising adoption procedures, in accordance with the BCEA and Labour Laws Amendment Act.
7.2 Eligibility
Adoption leave applies to employees who are adoptive parents of a child through formal legal adoption. Leave applies regardless of the employee''s gender.
7.3 Application and Documentation
Employee must provide written notice and copy of adoption order or court documentation.
Leave must be taken within a reasonable time of the adoption.
Leave is paid at ordinary rate of pay.
8. Commissioning Parental Leave
8.1 Entitlement
Employees involved in surrogacy arrangements as commissioning parents are entitled to 10 consecutive days of paid leave upon birth of the child, in accordance with the Labour Laws Amendment Act.
8.2 Eligibility
Commissioning parental leave applies to employees who are the commissioning parents under a valid surrogacy agreement. The child must be placed with the employee within 10 weeks of birth.
8.3 Application and Documentation
Employee must provide copy of surrogacy agreement and birth certificate.
Leave must be taken within 10 weeks of the child''s birth.
Leave is paid at ordinary rate of pay.
9. Family Responsibility Leave
9.1 Entitlement
Employees are entitled to 3 days of family responsibility leave per annum to attend to family matters.
9.2 Permitted Reasons
Death of a spouse, child, parent, or domestic partner.
Illness or injury of a spouse, child, parent, or domestic partner requiring urgent care.
Legal proceedings related to the custody or care of a child.
Other compelling family or domestic emergencies.
9.3 Application
Employee must provide notice as soon as reasonably practicable.
Supporting documentation may be required (death certificate, medical certificate, court summons).
Leave is paid at ordinary rate of pay.
Unused family responsibility leave does not carry over to the next year.
10. Study Leave
10.1 Study Leave
Employees may be granted study leave for accredited courses relevant to their role or professional development, subject to manager approval and operational requirements.
10.2 Arrangement
Employee must request study leave in advance.
Manager reviews relevance of study to business needs.
Leave may be unpaid or paid at management''s discretion.
Employee must provide proof of course completion.
11. Religious and Cultural Leave
11.1 Religious Observance
Employees are entitled to reasonable time off to observe significant religious holidays, subject to operational requirements and adequate notice.
11.2 Request Process
Employee must request time off in advance where possible.
Request is considered in light of business needs.
Leave may be paid or unpaid depending on circumstances.
Reasonable accommodation is provided where operationally feasible.
11.3 Cultural Events
Similar consideration is given for cultural or ceremonial observances of significance to the employee.
12. Leave Management System
Jera Consulting uses a digital leave management system for requesting, approving, and tracking leave:
All leave requests must be submitted through the system.
Employees can view accrued leave balances at any time.
Managers receive notifications of pending requests.
Records are maintained for verification and compliance purposes.
13. General Leave Procedures
13.1 Leave Request Process
Employee submits leave request through digital system with reason and dates.
Manager reviews request considering operational needs.
Manager approves or declines request (with explanation if declined).
Approved leave is confirmed with the employee.
13.2 Communication
Employees must ensure adequate coverage during absence.
Work must be handed over or covered by colleagues.
Managers maintain staffing schedules to minimise business disruption.
13.3 Return to Work
Employees are expected to return to work on the scheduled date.
Any extension of leave must be requested in advance where possible.
Unexplained absence may be treated as misconduct.
14. Leave During Public Holidays
Public holidays are non-working days. If leave falls on a public holiday, the public holiday remains a paid non-working day, and the leave is not deducted from the employee''s leave balance.
15. Leave During Notice Period
Employees may request leave during their notice period. Leave accrued must be taken from the employee''s leave balance. Outstanding leave is payable upon final payment.
16. Termination of Employment
16.1 Leave Payment on Termination
Upon termination of employment, the employee receives payment for:
All accrued annual leave.
Accrued sick leave (only if contractually agreed, otherwise forfeited).
Any other leave entitlements as due.
Payment is included in the final settlement and is paid on or before the last day of employment.
16.2 Outstanding Leave Deductions
Any leave taken but not yet earned at the time of termination may be deducted from the final payment.
17. Dispute Resolution
Disputes regarding leave entitlements or application of this policy may be raised with HR and are subject to the company''s grievance procedure.
18. Policy Review and Updates
This policy is reviewed annually to ensure compliance with current legislation and business needs. Amendments will be communicated to all employees.' where id='HR005';
update hr_policies set icon='🔍', summary='To establish a fair, transparent and equitable recruitment and selection process that attracts, identifies and appoints the most suitable candidate…', full_text='1. Objective
To establish a fair, transparent and equitable recruitment and selection process that attracts, identifies and appoints the most suitable candidates while complying with all applicable South African labour legislation, including the Employment Equity Act (EEA) 1998 as amended, the Basic Conditions of Employment Act (BCEA) 1997, the Protection of Personal Information Act (POPIA) 2013, and the Children''s Act 2005.
2. Scope
This policy applies to all positions at Jera Consulting (Pty) Ltd, including permanent, fixed-term contract, and temporary roles. It covers the entire recruitment and selection process from vacancy identification through appointment and probation.
3. Policy
3.1 Employment Equity and B-BBEE Compliance
Jera Consulting is committed to promoting employment equity and advancing B-BBEE (Broad-Based Black Economic Empowerment) objectives in accordance with the EEA 1998 (as amended 2020).
Recruitment and selection will actively address historical imbalances and promote equity across race, gender, disability, and other designated grounds as per the EEA.
Advertisement of positions will encourage applications from designated groups and reflect the company''s commitment to diversity.
Selection criteria will be job-related and applied consistently to all candidates, regardless of designated group status.
3.2 Fair Selection Practices
All recruitment decisions must be based on merit and job-related competencies.
Selection panels should be diverse, including representation from different departments and levels where possible.
Candidates must be treated with dignity and respect throughout the process.
All candidates must receive clear communication regarding application status and interview timelines.
3.3 Probation Period
In accordance with BCEA provisions:
Probation periods shall be reasonable and typically between 3-6 months depending on role complexity.
Probation periods exceeding 6 months require justification and documented business reason.
During probation, performance must be monitored and feedback provided regularly.
At the conclusion of probation, a formal assessment must be documented.
Probation does not exempt employees from statutory rights or protections under the BCEA or other applicable legislation.
3.4 Filling Vacancies
All vacancies will be reviewed to assess whether the position is still required, can be restructured, or may be combined with other roles.
Internal applicants are encouraged and will be considered fairly alongside external candidates.
Vacant positions will be advertised internally for a minimum of 5 working days before external advertisement.
3.5 Internal and External Recruitment
Internal Recruitment:
Employees are encouraged to apply for available positions.
Internal candidates will be notified of vacancies and given equal opportunity to apply.
Internal candidates who are unsuccessful will receive feedback on their application.
External Recruitment:
External recruitment may occur through job boards (including LinkedIn and professional job portals), recruitment agencies, direct approach, or employee referral.
All external candidates must complete formal application forms or online applications.
Advertisement copy must reflect the company''s commitment to employment equity and welcome applications from designated groups.
3.6 Interviews and Assessment
Structured interviews will be conducted by trained panel members using a consistent set of questions and evaluation criteria.
Competency-based questions will assess required technical and soft skills for the role.
Interview notes must be documented and retained.
All candidates interviewed must be informed of the outcome in writing.
3.7 Psychometric and Competency Testing
Where psychometric or competency assessments are used:
Tests must comply with the EEA s8 requirements and be validated for the role and context.
Results must not be used as the sole selection criterion.
Candidates with disabilities must be provided reasonable accommodation, including alternative formats or additional time.
Test results are confidential and disclosed only to those involved in the selection decision.
The company will ensure tests are culturally appropriate and non-discriminatory.
3.8 Reference Checks
Candidate consent must be obtained before contacting previous employers or referees.
Reference checks must be documented and retained.
Requests for references must be limited to job-relevant information.
All candidates should be given the opportunity to provide references and to know what references have been obtained.
3.9 Background Screening and Vetting
For certain positions (e.g., finance, child-related roles), background screening may be required:
Candidate written consent must be obtained before conducting background checks.
Checks may include criminal record verification, credit checks (where relevant), or professional credential verification.
Any adverse findings must be communicated to the candidate who may provide explanation before final decision.
Background screening will comply with POPIA requirements regarding personal information handling.
3.10 POPIA Compliance
All personal information collected during recruitment will be handled in accordance with POPIA:
Candidates will be informed how their data will be used and retained.
Personal information will be stored securely and access limited to relevant selection panel members.
Information from unsuccessful candidates will be deleted after 6 months unless required to be retained by law.
Candidates have the right to access and correct their personal information.
3.11 Digital Recruitment
The company may use LinkedIn, job portals, and applicant tracking systems (ATS) in recruitment.
All digital platforms must comply with POPIA in handling candidate data.
Automated screening tools may be used but must not discriminate based on protected grounds.
Human review of applications will occur before shortlisting decisions.
3.12 Employment Contract
All appointed candidates will be provided with a written employment contract before commencing employment.
The contract must clearly specify terms of employment including role, salary, probation period, and notice periods.
Contracts for employees under minimum BCEA threshold earning levels will include mandatory minimum entitlements.
Contracts will be provided in the employee''s preferred language where reasonably possible.
3.13 Minimum Working Age
In accordance with the Children''s Act 2005:
The company does not employ children under 15 years of age.
Employment of persons aged 15-18 in non-hazardous work is permitted with parental/guardian consent.
No employee under 18 will be employed in hazardous work as defined by the Children''s Act.
4. Responsibilities
HR Department: coordinate recruitment process, ensure compliance, manage POPIA requirements, and maintain records.
Hiring Managers: provide accurate job descriptions, participate in interviews, and make selection recommendations.
Selection Panel: assess candidates fairly and consistently, document decisions, and provide feedback.
5. Document Retention
All recruitment records (application forms, interview notes, assessment results, references) will be retained for a minimum of 2 years from date of appointment or rejection.
6. Effective Date
This policy is effective from 1 April 2026 and applies to all recruitment activities from that date forward.
7. References
Employment Equity Act, 1998 (as amended 2020)
Basic Conditions of Employment Act, 1997
Protection of Personal Information Act, 2013 (POPIA)
Children''s Act, 2005
Labour Relations Act, 1995' where id='HR006';
update hr_policies set icon='💻', summary='To establish a fair and transparent policy regarding the provision of IT equipment and technology allowances to employees who require computing dev…', full_text='1. Objective
To establish a fair and transparent policy regarding the provision of IT equipment and technology allowances to employees who require computing devices for the effective performance of their duties, and to clarify conditions, tax implications, security requirements, and maintenance responsibilities.
2. Scope
This policy applies to all employees of Jera Consulting (Pty) Ltd whose roles require IT equipment for work performance, including remote workers, office-based staff, and hybrid workers. It covers laptops, smartphones, tablet devices, home office equipment, and related technology allowances.
3. Policy
3.1 Qualifying Criteria
An employee qualifies for an IT equipment allowance if:
Their role requires regular computer/device use for job performance.
They are employed on a permanent or fixed-term contract of 12 months or longer.
They work in a role approved by management for IT allowance provision.
They have completed probation period (if applicable).
Temporary or contract workers may receive equipment on a case-by-case basis as approved by management.
3.2 Equipment and Allowance Amounts
The following equipment allowances may be provided (2026 rates):
Laptop computer: R15,000 - R25,000 depending on job level and role requirements (typically R18,000).
Smartphone: R8,000 - R12,000 for roles requiring mobile connectivity (typically R10,000).
Monitor/peripherals (when home office required): R4,000 - R6,000.
Home office furniture allowance (one-time): R5,000 - R8,000 for permanent remote workers.
Allowances are reviewed annually and adjusted for inflation where applicable.
3.3 SARS Tax Implications - Section 8(1)(a) Allowances
In accordance with SARS Section 8(1)(a) of the Income Tax Act:
IT equipment allowances may be provided tax-free if they constitute a genuine allowance for tools of trade used exclusively for business purposes.
Company-issued equipment remains the property of the company and does not create a taxable allowance.
If an employee receives a cash allowance in lieu of equipment, SARS may deem this as income subject to tax.
The company will advise employees of tax implications during the allowance negotiation process.
Employees receiving equipment allowances should consult their tax advisor regarding personal tax implications.
3.4 Company Specifications and Standards
Where the company provides equipment:
Equipment must meet company IT security and operational standards.
Approved device models and brands are specified by the IT Department.
Equipment will be configured with mandatory security software, firewalls, and encryption.
Remote access tools and VPN software will be installed and required for all remote work.
Device asset tags and inventory numbers will be assigned and tracked.
3.5 BYOD (Bring Your Own Device) vs Company-Issued Equipment
Company-Issued Equipment:
Remains the property of Jera Consulting.
May be recalled at any time.
Is subject to IT security controls and monitoring policies.
Is insured by the company.
Bring Your Own Device (BYOD):
Optional personal device use may be permitted for specific low-risk business applications (e.g., email, calendar, document review).
BYOD access is at the company''s discretion and may be revoked.
The employee bears the cost of the device and maintenance.
The company will not be responsible for damage, loss, or malfunction of personal devices.
Personal devices must meet minimum security standards and have approved MDM (Mobile Device Management) enrollment.
Employees using personal devices must ensure the device is insured separately.
3.6 Data Security and POPIA Compliance
All IT equipment (company or BYOD) used to access company data must comply with POPIA:
Devices must have antivirus and anti-malware software installed and regularly updated.
Devices must have full-disk encryption or equivalent security controls.
Passwords/biometric authentication must be required to access the device.
Company data must not be stored permanently on personal devices; cloud storage is preferred.
Employees must ensure prompt patching of security vulnerabilities and OS updates.
Remote work devices must connect via company VPN for accessing sensitive systems.
Devices found non-compliant with security requirements will have company data access suspended until remedied.
3.7 Insurance
Company-Issued Equipment:
The company maintains insurance covering accidental damage, theft, and loss of equipment.
Standard insurance excess is R1,000 per incident.
Insurance does not cover intentional damage or theft due to employee negligence.
Personal Devices (BYOD):
The employee is responsible for maintaining their own insurance.
The company will not reimburse for damage, loss, or theft of personal devices.
3.8 Maintenance and Support
Company-Issued Equipment:
The company provides hardware maintenance and IT support.
Software updates and security patches will be deployed automatically or as required.
Repairs or replacement of faulty equipment are handled by the IT Department.
Personal Devices (BYOD):
The employee is responsible for all maintenance and repair costs.
The company will provide basic IT support only; complex issues may be referred to external support at employee cost.
3.9 Remote Work Equipment Provisions
For employees working from home:
The company may provide or subsidize ergonomic furniture (desk, chair) to the value specified above.
Employees must maintain a safe and secure workspace.
Internet connectivity is the employee''s responsibility; the company may provide a stipend for qualifying roles.
Power backup (UPS) or portable chargers may be provided for critical roles.
3.10 Return of Equipment on Termination
All company-issued equipment must be returned in full working condition (normal wear and tear excepted).
Equipment must be returned on or before the final day of employment.
Any outstanding costs for unreturned or damaged equipment may be deducted from final salary (in accordance with BCEA provisions).
Data must be securely wiped from the device before return.
Remote access credentials must be deactivated immediately upon termination.
4. Allowance Eligibility and Changes
New equipment is typically not provided more frequently than every 3-4 years, unless justified by role change or technical obsolescence.
Employees changing roles may be entitled to different equipment in accordance with their new position.
Reduction or withdrawal of equipment allowance requires 30 days notice and documented business reason.
5. Responsibilities
HR Department: manage allowance policies, approve equipment requests, and track inventory.
IT Department: specify approved equipment, maintain security standards, and provide technical support.
Employees: ensure equipment security, report issues promptly, maintain compliance with security policies, and return equipment upon termination.
Managers: verify employee eligibility and approve equipment requests for their team.
6. Effective Date
This policy is effective from 1 April 2026.
7. References
Income Tax Act, 1962 (SARS Section 8(1)(a))
Protection of Personal Information Act, 2013 (POPIA)
Basic Conditions of Employment Act, 1997' where id='HR007';
update hr_policies set icon='✈️', summary='To establish clear guidelines for the reimbursement of legitimate business travel and subsistence expenses incurred by employees while travelling o…', full_text='1. Objective
To establish clear guidelines for the reimbursement of legitimate business travel and subsistence expenses incurred by employees while travelling on company business, ensuring cost-effective travel practices while maintaining employee comfort and safety.
2. Scope
This policy applies to all employees of Jera Consulting (Pty) Ltd who are required to travel for business purposes, including travel within South Africa and international travel.
3. Policy
3.1 Approval Process
All business travel must be approved in advance by the employee''s manager.
International travel above R50,000 requires Managing Director approval.
Travel requests should be submitted at least 2 weeks before departure to allow adequate planning.
Emergency travel may be approved with retrospective documentation.
3.2 Cost-Effective Travel
Employees must seek the most cost-effective travel options consistent with business needs and personal safety.
Economy class air travel is the standard for domestic flights.
Business class flights require justification (e.g., flight duration exceeding 6 hours, executive-level meetings).
First-class travel is not permitted unless exceptional circumstances are documented and approved.
Car rental is preferred over air travel for journeys under 800 km.
Public transport (train, bus) should be considered for domestic travel where practical.
3.3 Travel Agent and Booking
Employees must use the company''s preferred travel service provider where available to obtain negotiated rates.
Direct booking via airline or travel portal is permitted if providing better value than travel agent.
Travel agent arrangements must include travel insurance as standard.
3.4 Airlines and Domestic Travel
Preferred domestic airlines (as of 2026):
South African Airways (SAA) - national carrier, preferred provider.
FlySafair - low-cost domestic option for price-sensitive routes.
Airlink - regional services for regional airports.
Other IATA-registered airlines may be used if providing superior value or convenience.
Note: Comair ceased operations in 2022 and is no longer available.
3.5 Classes of Travel
Domestic Travel:
Economy: standard for all staff below management level.
Business/Premium Economy: available for flights exceeding 4 hours or for senior management with approval.
International Travel:
Economy: standard for flights under 8 hours.
Business Class: flights exceeding 12 hours or for senior management travelling to key meetings.
All business class upgrades on international flights require pre-approval.
3.6 Car Rental
Standard rental vehicle categories by role/purpose:
Compact/Small Car (e.g., Toyota Yaris): consultant/staff travelling alone.
Sedan (e.g., Toyota Corolla): senior staff or multi-day trips.
SUV (e.g., Toyota RAV4): trips exceeding 5 days or rough terrain; family travel (multiple occupants).
Electric vehicles: increasingly available through rental companies; preferred for carbon footprint reduction.
Employees must:
Verify insurance coverage before accepting vehicle.
Check vehicle condition and report damage before departure.
Maintain fuel receipts and mileage logs.
Return vehicle in clean condition to avoid cleaning charges.
3.7 Travel Insurance
The company will arrange and cover travel insurance for international travel.
Insurance covers trip cancellation, medical emergencies abroad, lost baggage, and travel delays.
Employees must declare pre-existing medical conditions for international cover.
Domestic travel does not require separate travel insurance if covered under company general insurance.
3.8 Combining Business and Private Travel
Employees may extend business trips for personal purposes, but must absorb all additional costs.
The company will only reimburse the cost of the outbound business trip.
If extending travel, employees must notify their manager and adjust work schedules accordingly.
If private travel reduces overall cost to the company, the benefit may be shared with the employee.
3.9 Accommodation
Accommodation standards by trip duration and location:
City business travel (Johannesburg, Cape Town, Durban): 3-4 star hotels; maximum nightly rate R1,500.
Regional/smaller towns: 3-star hotels or B&B accommodations; maximum nightly rate R900.
Extended stays (exceeding 5 nights): discounted corporate rates must be negotiated; serviced apartments may be more economical.
International travel: 4-5 star hotels appropriate to destination; nightly rates vary by city (Europe/US R2,500-4,000; Africa R1,500-2,500).
Breakfast Inclusions:
Hotel breakfast should be included where available; additional meal expenses are reimbursed separately.
3.10 Per Diem (Meal and Incidental Allowances)
SARS Deemed Rates (2026) for South Africa:
Domestic daily allowance: R522 per full day (covers meals and incidentals).
Half-day allowance (less than 12 hours): R261.
Employees may claim actual expenses if receipts are provided and exceed deemed rates.
International Travel Per Diem:
United States/Europe: USD 75-100 per day (approximately R1,350-1,800).
Southern Africa (excl. SA): USD 50-75 per day.
Other destinations: determined by company HR based on cost of living.
Per diem is paid daily unless actual expense receipts are provided.
3.11 Parking and Vehicle Tolls
Parking fees are reimbursable with receipts.
Urban parking allowance for week-long city travel: R100-150 per day.
Highway tolls (e.g., Gauteng Freeway Toll, N1 tolls): fully reimbursed with e-toll/manual receipts.
Employees using personal vehicles for business travel may claim mileage at SARS rate (2026: R1.50 per km).
3.12 No-Show and Cancellation Fees
Employees are responsible for cancelling bookings if travel plans change.
No-show fees and cancellation penalties may be deducted from the employee''s salary if caused by employee negligence.
The company will cover reasonable cancellation fees for legitimate business reasons (e.g., client emergency).
3.13 Spouse/Family Travel
Spouse/family members may accompany employees on business travel only with prior management approval.
The company will only reimburse the employee''s portion of shared accommodation and transport costs.
Additional costs for spouse/family (meals, entertainment, activities) are the employee''s responsibility.
3.14 Extended Trips and Sabbaticals
Extended business assignments (exceeding 3 months) require specific approval from Managing Director.
Rental accommodation may be arranged for extended stays; the company will cover reasonable rates.
Return flights home may be funded quarterly for employees on long-term assignment.
4. Expense Claims and Reimbursement
All claims must be submitted within 30 days of trip completion with supporting receipts.
Electronic receipts (email confirmations) are acceptable; original receipts must be retained for audit purposes.
Claims must be submitted via the company expense management system with approval from the employee''s manager.
Processing time: claims are typically reimbursed within 5-7 working days of approval.
5. Responsibilities
Employees: arrange travel cost-effectively, obtain pre-approval, submit claims promptly with receipts.
Managers: approve travel requests, monitor team travel costs, review expense claims.
HR Department: maintain travel policy, arrange corporate agreements with suppliers, process reimbursements.
6. Effective Date
This policy is effective from 1 April 2026.
7. References
South African Revenue Service (SARS) Travel Allowance Deemed Rates 2026
Basic Conditions of Employment Act, 1997
Income Tax Act, 1962' where id='HR008';
update hr_policies set icon='🌙', summary='To establish clear guidelines regarding private work, consulting, and freelancing activities undertaken by employees outside of working hours, whil…', full_text='1. Objective
To establish clear guidelines regarding private work, consulting, and freelancing activities undertaken by employees outside of working hours, while protecting the company''s interests, intellectual property, client confidentiality, and ensuring compliance with restraint of trade and non-compete considerations.
2. Scope
This policy applies to all employees of Jera Consulting (Pty) Ltd. It covers private work, consulting, freelancing, online businesses, content creation, and any form of self-employment or income-generating activities undertaken outside normal working hours.
3. Policy
3.1 Services and Work Within Office Hours
No private work, consulting, freelancing, or income-generating activities are permitted during company office hours or working time.
Employees must devote their full attention and effort to company business during contracted working hours.
Time spent on personal projects, freelancing platforms, client calls, or content creation during work hours is a breach of this policy and may result in disciplinary action.
Exceptions: personal administrative tasks (e.g., doctor''s appointment) within reasonable personal time (breaks, lunch period).
3.2 Services and Work Outside Office Hours
Private work undertaken outside contracted working hours (evenings, weekends, leave periods) is permitted, subject to the following conditions:
The activity does not interfere with the employee''s ability to perform company duties effectively.
The activity does not create a conflict of interest with the company or its clients.
The activity does not compete directly with company business (see Non-Compete clause below).
The activity does not breach any restraint of trade clause in the employment contract.
The activity does not use company resources (see below).
The activity does not breach POPIA or confidentiality regarding company/client data.
3.3 Examples of Permitted Private Work
Employees may undertake the following types of private work outside office hours (subject to above conditions):
Freelance writing, editing, or journalism (unrelated to company''s client list).
Web/app development or software coding for external clients or personal projects.
Social media management or content creation (YouTube channel, podcast, blog) provided it does not promote competing services.
Consulting or advisory work in non-competing fields.
Online teaching, training, or course creation.
Online sales or e-commerce (Etsy, Amazon, online store) for unrelated products.
Freelance platforms (Upwork, Fiverr, Freelancer) for services not in competition with company.
Part-time or casual employment with unrelated employers.
3.4 Prohibited Private Work Activities
Any work that directly competes with Jera Consulting''s services or offerings.
Consulting or services provided to Jera Consulting''s current clients without company knowledge and approval.
Work that breaches restraint of trade or non-compete clauses in the employment contract.
Activities using proprietary company information, client lists, or trade secrets.
Work that materially interferes with the employee''s performance, availability, or health.
Freelancing or contract work with direct competitors of Jera Consulting.
3.5 Company Resources
Company equipment (laptop, smartphone, software, internet connection) must not be used for private work.
Company office space, meeting rooms, or facilities may not be used for private work activities.
Company intellectual property, designs, code, or proprietary tools may not be used for private work.
Company client databases, contact lists, or confidential information may not be used for private work.
Violation of this clause may result in disciplinary action and potential legal claims.
3.6 Intellectual Property (IP) and Work Product
Ownership of intellectual property depends on how and where the work was created:
Work created using company resources, equipment, or time belongs to the company, even if undertaken ostensibly as private work.
Work created entirely outside office hours using personal equipment may belong to the employee, but only if unrelated to company business.
If private work incorporates company IP, client information, or proprietary knowledge, ownership disputes may arise and will be resolved based on legal principles and the employment contract.
Employees must declare any work product that could potentially involve company IP or client information to HR before proceeding.
The company reserves the right to claim ownership or license rights to any work created using company resources.
3.7 Non-Compete and Restraint of Trade
Many employee contracts contain non-compete or restraint of trade clauses restricting work with competitors during and after employment.
Employees must review their employment contract to understand any restraint obligations.
Breaching a restraint clause may expose the employee to legal action (injunction, damages) from the company.
The company may seek legal remedies to prevent breach or enforce restraint terms.
Employees considering work in potentially competing fields should consult with HR before commencing.
3.8 POPIA Compliance and Client Confidentiality
Client information (names, contact details, project data, financials) obtained through company work is confidential and proprietary.
Client data may not be used, referenced, or disclosed for private work or freelancing activities.
Employees may not use company client relationships to solicit business for private work.
Violation of POPIA or confidentiality may result in disciplinary action and legal claims for damages.
Employees must ensure private work does not involve handling personal information of company clients without appropriate safeguards.
3.9 Declaration and Approval Process
Employees contemplating private work outside office hours are encouraged to declare the activity to HR:
A formal declaration is recommended for any activity that could potentially involve conflict of interest or IP concerns.
Declaration should be made before commencing the private work.
HR will review the declaration and advise whether the activity is permitted under this policy and the employment contract.
Written approval from HR provides protection for the employee and clarity for the company.
Failure to declare private work does not automatically permit the activity; breach may still be actionable.
3.10 Ongoing Obligations
Employees must monitor their private work activities to ensure continued compliance with this policy.
If circumstances change (e.g., client becomes a company client), the employee must immediately notify HR.
Employees must not allow private work to interfere with availability for company duties, training, or travel.
Remote work arrangements do not permit private work during company working hours.
4. Digital and Online Work Considerations
For employees engaged in digital freelancing, content creation, or online consulting:
Online freelancing platforms must be used only outside office hours.
Client communications and project work must not use company communication channels (email, Slack, Teams).
Personal brand development (YouTube, podcast, blog) must not reference company affiliation unless approved.
Content created must not breach non-compete or client confidentiality obligations.
Sponsored content or advertising must clearly disclose the employee''s affiliation and comply with advertising standards.
5. Consequences of Breach
Breach of this policy may result in disciplinary action up to and including dismissal.
Specific violations: using company resources for private work, breaching confidentiality, or creating IP conflicts may result in immediate suspension pending investigation.
The company may pursue civil claims for damages, recovery of costs, or enforcement of IP rights.
Breach of restraint of trade clauses may result in injunction proceedings and damage claims.
6. Responsibilities
Employees: declare private work activities, comply with policy, refrain from using company resources, protect client confidentiality.
HR Department: review declarations, provide guidance, monitor policy compliance, coordinate with legal if needed.
Managers: monitor team members for signs of conflicting private work, report concerns to HR.
7. Review and Amendment
This policy will be reviewed annually and amended as necessary to reflect evolving work practices, particularly in digital and remote work contexts.
8. Effective Date
This policy is effective from 1 April 2026.
9. References
Employment contract restraint of trade clauses
Protection of Personal Information Act, 2013 (POPIA)
Competition Act, 1998
Common law principles regarding intellectual property and confidentiality' where id='HR009';
update hr_policies set icon='🤝', summary='To establish comprehensive guidelines for the engagement, management, and termination of contractors, independent contractors, and temporary worker…', full_text='1. Objective
To establish comprehensive guidelines for the engagement, management, and termination of contractors, independent contractors, and temporary workers at Jera Consulting (Pty) Ltd, while ensuring compliance with South African labour legislation, particularly the Labour Relations Act (LRA) 1995 amendments, tax obligations, and intellectual property protections.
2. Scope
This policy applies to all non-employee workers engaged by Jera Consulting, including: independent contractors providing professional services, fixed-term contract workers, temporary workers provided by labour brokers/Temporary Employment Services (TES), and casual workers. It does not apply to employees on permanent or fixed-term employment contracts.
3. Policy
3.1 Types of Contractor Arrangements
3.1.1 Fixed-Term Contracts
Fixed-term contracts for a specified period (typically 3-12 months) are appropriate for project work or temporary cover.
Fixed-term contracts exceeding 3 months for workers earning below the BCEA threshold create an expectation of renewal and may expose the company to claims of unfair dismissal if not renewed.
Fixed-term contracts must be in writing and clearly specify: commencement date, end date, conditions for renewal, and that employment concludes on the specified end date.
If a fixed-term contract is renewed or extended beyond the original term, it may lose its fixed-term character and convert to indefinite employment.
Maximum cumulative fixed-term engagement is typically 24 months for the same role; beyond this period, indefinite employment may be implied.
3.1.2 Independent Contractors
Independent contractors are self-employed individuals retained to provide specific services or deliverables.
The relationship is service-based (not employment-based); the contractor manages their own methods and schedule.
Independent contractors typically invoice for services and are responsible for their own tax, insurance, and benefits.
The company has limited control over how the contractor performs work, provided deliverables meet specifications.
Independent contractors may work for multiple clients and are responsible for managing conflicts.
No statutory benefits (leave, medical aid, UIF, severance) are provided to independent contractors.
3.1.3 Temporary Employment Services (TES) and Labour Broker Arrangements
The company may engage workers through registered labour brokers/TES to meet temporary staffing needs.
TES workers are employed by the labour broker, not by Jera Consulting, but work under company direction.
Section 198A of the LRA: employees earning below the BCEA threshold (currently R3,996 per month) employed by TES for exceeding 3 months are deemed employees of the client (Jera Consulting).
If a TES worker is deemed an employee under s198A, the company becomes liable for all employee statutory obligations.
To avoid inadvertent employee status, TES engagements below the threshold should not exceed 3 months, or the company must formally accept the worker as an employee.
High-skill TES workers earning above the BCEA threshold are not subject to the 3-month conversion rule.
3.2 Appointment Procedure
3.2.1 Contractor Selection
Contractors must be selected based on relevant experience, qualifications, and references.
Background screening may be conducted for sensitive roles (financial, access to facilities).
Contractor references must be checked and documented.
3.2.2 Contractor Agreements
All contractor arrangements must be formalized in a written contract/agreement.
Contracts must clearly specify: nature of work, deliverables, duration, payment terms, termination clauses, IP assignment, and confidentiality.
Contracts must state that the engagement is not an employment relationship (for independent contractors).
Independent contractor agreements should clarify that the contractor is responsible for tax (PAYE, Income Tax) and provide IRP30 exemption certificate if applicable.
All contractors must provide valid tax clearance certificates or confirm registered taxpayer status.
3.2.3 Tax and Compliance
Independent contractors earning more than R25,000 per annum are required to register as taxpayers.
Contractors providing an IRP30 exemption certificate confirm they have no tax liability; payments do not require PAYE withholding.
If a contractor does not provide an IRP30 exemption, the company must withhold PAYE at standard rates (approximately 20-40% depending on income).
The company will issue IRP501 (Payment Certificate) to contractors for tax purposes.
Contractors must declare their contractor income to SARS for personal tax returns.
Failure to comply with tax requirements may result in SARS penalties for both the company and contractor.
3.3 Management and Payment
3.3.1 Compensation and Invoicing
Independent contractors invoice for services rendered; payment is typically made within 30 days of invoice.
Fixed-term contract workers are typically paid monthly salary (PAYE applicable) or via services agreement.
TES workers'' wages are paid by the labour broker; the company reimburses the broker.
Rates are agreed upfront and clearly documented in the contract.
Payment terms must specify invoice submission requirements and payment conditions.
3.3.2 Tools of Trade and Equipment
The company will typically provide basic office equipment (desk, computer, phone) for contractors working on-site.
Contractors are responsible for specialized tools and software unless otherwise specified in the contract.
If the company provides equipment, the contractor acknowledges company ownership and agrees to return it upon completion.
Contractors must use company equipment only for contracted work and comply with IT security policies.
3.3.3 Work Location and Hours
Work location (office, remote, on-site at client location) must be specified in the contract.
Core hours or flexibility arrangements must be documented.
Contractors are expected to meet agreed deliverables and deadlines.
The company is not responsible for providing leave entitlements or paid time off for independent contractors (not applicable to fixed-term or TES workers).
3.4 Intellectual Property (IP) Assignment
All work product, deliverables, code, designs, documents, and intellectual property created by the contractor in the course of the engagement belong to Jera Consulting.
The contractor assigns all IP rights and consents to the company''s use, modification, and commercialization of the work.
If the work incorporates pre-existing IP or third-party material, the contractor must disclose this and provide appropriate licenses or rights.
The contractor warrants they have the right to assign the IP and that the work does not infringe third-party IP.
Contractor IP assignment should be explicitly documented in the engagement agreement.
3.5 Confidentiality and POPIA Compliance
Contractors must sign confidentiality/non-disclosure agreements protecting company and client information.
Client lists, project data, financial information, and proprietary processes must remain confidential.
Contractors handling personal information must comply with POPIA requirements.
Data processing agreements may be required for contractors processing personal data on behalf of the company.
Breach of confidentiality may result in termination and legal action for damages.
3.6 Performance and Expectations
Performance expectations and deliverables must be clearly documented.
Regular progress updates may be requested for longer engagements.
The company reserves the right to terminate the contract if deliverables are not met or quality standards are not maintained.
No expectation of permanent employment exists; contractors understand the engagement is temporary or project-based.
4. Termination of Contractor Agreements
4.1 Fixed-Term Contracts
Employment automatically concludes on the specified end date; no severance is required.
If the contract is not renewed and the worker earned below the BCEA threshold, a notice of non-renewal should be provided 30 days in advance.
If renewed or extended, the continuation must be formalized in writing to avoid inadvertent indefinite employment.
4.2 Independent Contractors
The engagement may be terminated immediately if specified in the contract or by mutual agreement.
If termination is without cause, reasonable notice (typically 2-4 weeks) should be provided.
Outstanding invoices are paid upon termination; no severance or terminal benefits are due.
Equipment must be returned in working condition.
4.3 TES Workers
Termination is arranged with the labour broker; the company instructs the broker to terminate the assignment.
TES workers may be terminated at any time unless deemed employees under s198A (in which case unfair dismissal protection applies).
Notice periods and termination procedures are governed by the TES agreement and applicable labour law.
4.4 Final Administration
Final payment includes any outstanding invoices or accrued payments.
All company equipment, access cards, and keys must be returned.
IT access (email, systems, data) must be disabled on termination date.
Final acknowledgment of confidentiality obligations should be obtained in writing.
5. Section 198A (LRA) - Critical Compliance Issue
The following requirements apply to prevent inadvertent employee status:
TES workers earning below the BCEA threshold (R3,996/month as of 2026) employed for more than 3 consecutive months become deemed employees of the client.
To engage a below-threshold worker beyond 3 months, the company must either: (a) terminate and replace the worker; (b) place them on a fixed-term contract with the company; or (c) formally accept them as an employee.
Once deemed an employee, the worker is entitled to all statutory protections: minimum wage, leave, severance, UIF, etc.
Failure to comply may expose the company to claims of unfair labour practice and wage claims.
6. Contractor Status - Independent vs. Employee
To protect contractor status and avoid inadvertent employment relationships:
The contractor should control their own working method and hours (not closely supervised).
The contractor should provide their own equipment and materials (unless agreed otherwise).
The contractor should be able to refuse work or delegate to a substitute (in some cases).
The contractor should be free to work for other clients and competitors.
Remuneration should be payment for deliverables/services, not hourly wages.
The contractor should not be integrated into company organizational structure or benefit from company benefits.
7. Responsibilities
HR Department: prepare contractor agreements, verify tax compliance, track contractor tenure for s198A compliance.
Finance Department: process invoices, issue tax certificates (IRP501), arrange TES broker payments.
Hiring Manager: clearly specify deliverables and expectations, provide regular feedback, advise HR of engagement end dates.
Legal/Compliance: review IP assignment clauses, ensure confidentiality agreements, monitor LRA compliance.
8. Effective Date
This policy is effective from 1 April 2026.
9. References
Labour Relations Act, 1995 (as amended) - Section 198A
Basic Conditions of Employment Act, 1997
Income Tax Act, 1962
Protection of Personal Information Act, 2013 (POPIA)
SARS Tax Registration and Compliance Requirements
Broad-Based Black Economic Empowerment (B-BBEE) Amendments' where id='HR010';
update hr_policies set icon='⏰', summary='Jera Consulting recognises that overtime may be necessary to meet operational demands and client requirements.', full_text='1. Introduction
Jera Consulting recognises that overtime may be necessary to meet operational demands and client requirements. This policy establishes the framework for the payment of overtime compensation in compliance with the Basic Conditions of Employment Act, 1997 (BCEA) and current South African labour law.
2. Objective
To ensure that all overtime work is:
Properly authorised and tracked
Fairly compensated in accordance with applicable legislation
Limited to circumstances where ordinary working hours cannot accommodate workload
Managed to protect employee well-being and work-life balance
3. Scope
This policy applies to all employees of Jera Consulting, with the exception of employees earning more than the current BCEA earnings threshold of approximately R254,371.67 per annum. Employees below this threshold are entitled to overtime compensation.
4. Policy Provisions
4.1 Qualifying Criteria for Overtime
Overtime is work performed beyond ordinary hours of work (maximum 45 hours per week in terms of the BCEA). Employees may be required to work overtime where:
Business demands require extended hours
A client engagement or project deadline necessitates additional work
Operational or emergency circumstances arise
Staffing shortages occur due to illness, leave, or turnover
4.2 Pre-Approval Requirement
All overtime must be pre-approved by the employee''s direct manager or supervisor before the work is performed. Ad-hoc overtime should be reported and approved as soon as practicable. Emergency overtime performed without prior approval must be reported to the manager within 24 hours and will be retrospectively approved if deemed necessary.
4.3 Overtime Payment Rates
Overtime compensation shall be calculated and paid as follows:
Ordinary overtime (Monday-Saturday): 1.5 times the employee''s normal hourly rate
Sunday work: 2 times the employee''s normal hourly rate
Public holiday work: 2 times the employee''s normal hourly rate
The normal hourly rate is calculated based on the employee''s ordinary remuneration divided by the ordinary hours of work per week.
4.4 Maximum Overtime Hours
In accordance with the BCEA s10, employees may not work more than 10 hours of overtime per week, unless an exemption applies under the BCEA or as agreed in writing. The ordinary hours of work shall not exceed 45 hours per week.
4.5 Time Off in Lieu of Overtime Payment
By mutual written agreement between the employee and employer, an employee may receive time off in lieu of overtime payment. The time off shall be calculated at the applicable overtime rate and must be taken within a reasonable period agreed by the parties. This arrangement does not reduce the employee''s total compensation entitlement.
4.6 Compressed Work Week Provisions
Where the company implements a compressed work week arrangement (e.g., 4-day week with extended daily hours), the arrangement must be in writing and comply with the BCEA. Ordinary hours remain capped at 45 per week. Any hours worked beyond the compressed schedule shall be treated as overtime.
4.7 Remote Work Overtime Tracking
For employees working remotely, overtime must be logged in the company''s time-tracking system or as otherwise directed by management. Managers are responsible for monitoring and controlling remote employee overtime to prevent overwork and burnout. Reasonable expectations regarding remote work response times should be clearly communicated.
5. Procedures
5.1 Requesting Overtime
Employees requiring overtime should:
Notify their manager as early as possible of the anticipated overtime requirement
Provide a brief reason for the overtime request
Obtain written or documented approval from the manager
Log the overtime in the company''s time and attendance system (where applicable)
5.2 Recording Overtime
Employees must:
Maintain accurate records of all overtime worked
Record start and end times for overtime shifts
Submit timesheets or overtime logs to their manager for verification
Ensure data is entered into the system before the close of the pay cycle
5.3 Verification and Approval
Managers must:
Verify that all overtime was approved and necessary
Review and approve timesheets or overtime logs
Ensure accurate calculation of overtime compensation
Submit verified overtime information to Human Resources
5.4 Payment Processing
Human Resources will:
Calculate overtime payments based on the verified timesheets
Include overtime compensation in the employee''s regular salary
Provide a breakdown of overtime hours and payment in the pay slip
Maintain records of all overtime paid for compliance and audit purposes
5.5 Disputes and Adjustments
Any discrepancies in overtime payment should be reported to Human Resources within 30 days of the relevant pay period. Human Resources will investigate and make corrections where errors are identified.
6. Management Responsibilities
Managers are responsible for:
Planning work schedules to minimise unnecessary overtime
Pre-approving all overtime before work commences
Monitoring employee workload to prevent excessive overtime
Reviewing trends in overtime to identify systemic issues
Ensuring overtime is fairly distributed among team members
Promptly reporting overtime needs to support workload management
7. Employee Responsibilities
Employees are responsible for:
Seeking approval before performing overtime
Recording all overtime accurately and promptly
Managing their own work efficiency to minimise overtime
Raising concerns if overtime becomes excessive or unsustainable
Complying with health and safety obligations while working overtime
8. Implementation and Review
This policy is effective from 1 May 2026 and will be reviewed annually or in response to legislative changes. Managers and employees will receive training on the overtime procedures upon implementation and as required.
9. Legislative Framework
This policy is based on and complies with:
The Basic Conditions of Employment Act, 1997 (BCEA), as amended
The Labour Relations Act, 1995 (LRA)
Current South African employment law and practice' where id='HR011';
update hr_policies set icon='🚭', summary='Jera Consulting is committed to providing a healthy, safe, and productive working environment for all employees, clients, and visitors.', full_text='1. Introduction
Jera Consulting is committed to providing a healthy, safe, and productive working environment for all employees, clients, and visitors. This Smoke-Free Workplace Policy establishes clear guidelines for the prohibition of smoking and vaping in all company premises and work-related activities.
2. Objective
To:
Protect the health and well-being of all individuals in the workplace by eliminating exposure to tobacco smoke and electronic vapours
Comply with the Tobacco Products Control Act, 83 of 1993 (as amended) and the Control of Tobacco Products and Electronic Delivery Systems Bill (2018 onwards)
Create a professional, clean working environment
Support employees in reducing and quitting smoking
Establish clear roles and responsibilities for policy enforcement
3. Policy Statement
Smoking, the use of e-cigarettes, vaping devices, and heated tobacco products are strictly prohibited in all company premises, vehicles, and during all work-related activities, including:
All offices, meeting rooms, corridors, stairwells, and common areas
Company vehicles and site visit locations
Virtual and online meetings where employees represent the company
Client facilities while on company business
Parking areas and building entrances
This total ban applies to all employees, contractors, vendors, clients, and visitors, with no exceptions for designated smoking areas within company premises.
4. Normative References and Legislation
This policy is based on and complies with:
The Tobacco Products Control Act, 83 of 1993 (as amended)
The Control of Tobacco Products and Electronic Delivery Systems Bill (2018 onwards)
The Occupational Health and Safety Act, 85 of 1993
Common law duties to protect employees from harm
Relevant provincial and local by-laws regulating smoking in workplaces
5. Definitions
5.1 Smoking
The act of smoking, holding, or otherwise consuming any tobacco product in any form, including cigarettes, cigars, and pipe tobacco.
5.2 E-Cigarettes and Vaping
The inhalation and exhalation of vapour from electronic nicotine delivery systems (ENDS), electronic non-nicotine delivery systems (ENNDS), and any similar device designed to aerosolise and deliver substances for inhalation, including e-cigarettes, vape pens, and pod-based systems.
5.3 Heated Tobacco Products
Tobacco products heated to a temperature below combustion, including heat-not-burn devices, which produce an aerosol containing nicotine and other substances.
5.4 Workplace
All locations where employees conduct work on behalf of Jera Consulting, including offices, remote work sites, client premises, vehicles, and virtual work environments.
6. Designated Outdoor Smoking Areas
Although smoking is prohibited in all company premises, Jera Consulting recognises that employees may wish to smoke during personal break time. A designated outdoor smoking area may be established at the discretion of management, subject to the following conditions:
The area shall be situated at least 8 metres away from building entrances, windows, and ventilation outlets
The area shall not be accessible to non-smokers or those wishing to avoid smoke exposure
Smoking shall be restricted to designated breaks and shall not interfere with work duties or productivity
Smokers are responsible for removing and properly disposing of cigarette butts and related waste
Outdoor smoking areas must comply with all local municipal and provincial by-laws
7. Information, Education, and Support
7.1 Employee Communication
Jera Consulting will:
Communicate this policy to all employees during onboarding
Provide printed copies of the policy in the office and make it available on the company intranet
Display prominent signage indicating the smoke-free workplace policy
Conduct awareness campaigns highlighting the health benefits of a smoke-free environment
7.2 Health Information
The company will provide information on:
The health risks of smoking, secondhand smoke, and vaping
The link between smoking and workplace accidents
The benefits of quitting smoking for personal health and family well-being
7.3 Smoking Cessation Support
Jera Consulting is committed to supporting employees who wish to quit smoking. Support available includes:
Access to Employee Assistance Programme (EAP) counselling and cessation programs
Information about nicotine replacement therapy options
Referrals to external smoking cessation clinics and support groups
Flexibility in work arrangements to support cessation attempts
Confidential support without judgment
8. Visitor and Contractor Policy
All visitors, contractors, and external service providers are subject to this smoke-free workplace policy. Upon arrival, all parties will be informed of the policy. Violations by contractors or vendors may result in contract termination or non-renewal.
9. Responsibilities
9.1 Employer Responsibilities (Jera Consulting)
Jera Consulting is responsible for:
Implementing and communicating the policy to all stakeholders
Ensuring all premises and vehicles comply with smoke-free requirements
Monitoring and enforcing compliance through fair and consistent application
Providing cessation support and resources to employees
Addressing violations promptly and fairly
Maintaining a healthy and safe workplace
9.2 Manager and Supervisor Responsibilities
Managers and supervisors are responsible for:
Ensuring their teams are aware of the smoke-free policy
Modeling compliance by not smoking or vaping in the workplace
Addressing violations promptly and consistently
Supporting employees seeking cessation assistance
Reporting persistent violations to Human Resources
9.3 Employee Responsibilities
All employees are responsible for:
Complying with the smoke-free workplace policy
Not smoking, vaping, or using heated tobacco products on company premises or during work-related activities
Respecting the rights of others to work in a smoke-free environment
Reporting violations by other employees or visitors to management or Human Resources
Supporting colleagues who are attempting to quit smoking
10. Enforcement and Disciplinary Action
10.1 Approach to Violations
Jera Consulting will take a supportive approach to first-time violations, providing counselling and information about cessation support. Repeated violations will be addressed through formal disciplinary procedures in accordance with the company''s Employee Relations Policy and the Labour Relations Act.
10.2 Disciplinary Consequences
Depending on the circumstances, violations may result in:
Formal warning and requirement to attend cessation counselling
Suspension of certain privileges (e.g., work-from-home arrangements)
Disciplinary action up to and including dismissal for persistent or serious violations
All disciplinary action will be fair, proportionate, and conducted in accordance with the Labour Relations Act, 1995.
10.3 Reporting Violations
Employees or visitors may report violations confidentially to:
Their direct manager
Human Resources
A designated point of contact identified in internal communications
11. Implementation Timeline
This policy is effective immediately upon publication. All employees, contractors, and visitors will be notified of the updated smoke-free workplace policy. A grace period of 30 days is provided for employees and contractors to adjust to the new requirements. After this period, full enforcement will commence.
12. Review and Amendment
This policy will be reviewed annually and amended as necessary to reflect changes in legislation, best practices, and operational requirements.
13. Legislative Framework
This policy is based on and complies with:
The Tobacco Products Control Act, 83 of 1993 (as amended)
The Control of Tobacco Products and Electronic Delivery Systems Bill (2018 onwards)
The Occupational Health and Safety Act, 85 of 1993
The Labour Relations Act, 1995
Applicable provincial and municipal regulations' where id='HR012';
update hr_policies set icon='🤲', summary='Jera Consulting is committed to creating a diverse, inclusive, and equitable workplace where all individuals are treated fairly and have equal oppo…', full_text='1. Introduction
Jera Consulting is committed to creating a diverse, inclusive, and equitable workplace where all individuals are treated fairly and have equal opportunities to develop and advance their careers. This Employment Equity Policy reflects our dedication to eliminating unfair discrimination and creating a representative workforce that reflects the diversity of South African society.
2. Objective
To:
Eliminate unfair discrimination in all employment practices
Advance equity and promote the interests of designated groups in the workplace
Develop a diverse workforce that reflects the demographic composition of South Africa
Ensure equal pay for work of equal value
Create an inclusive culture where all employees can thrive
Comply with the Employment Equity Act, 1998 (as amended by the Employment Equity Amendment Act, 4 of 2022)
3. Governing Principles
This policy is founded on the following principles:
3.1 Compliance with Legislation
Full compliance with the Employment Equity Act, 1998, and the 2022 amendments
Adherence to the Constitution of the Republic of South Africa, 1996
Compliance with the Protection of Personal Information Act (POPIA)
Alignment with the Broad-Based Black Economic Empowerment (B-BBEE) Act and current B-BBEE Codes
3.2 Fair Implementation
Employment equity initiatives will be fair, transparent, and applied consistently across the organisation
No employee will be unfairly discriminated against or disadvantaged
Merit and competence remain central to all employment decisions
3.3 Integration into Strategy
Employment equity is integrated into the company''s overall business strategy and human resources planning
Diversity and inclusion are considered in all strategic decisions
4. Policy Statement
4.1 Designated Groups
In accordance with the Employment Equity Act, as amended, Jera Consulting recognises the following designated groups:
Black employees (African, Coloured, and Indian employees)
Women of all races
People with disabilities
4.2 Zero Tolerance for Unfair Discrimination
Jera Consulting will not unfairly discriminate, directly or indirectly, against any employee or job applicant on the grounds of:
Race, colour, ethnicity, or national origin
Gender or gender identity
Sex or sexual orientation
Pregnancy or marital status
Family or parental responsibility
Disability
Religion or belief
Age
Political opinion or affiliation
Conviction for a crime (subject to certain exceptions)
Unfair discrimination includes harassment, bullying, and creating a hostile work environment based on any of these characteristics.
4.3 Equal Pay for Work of Equal Value
In accordance with section 6(4) of the Employment Equity Act (as amended), Jera Consulting is committed to ensuring that employees performing work of equal value receive equal remuneration. Pay audits will be conducted regularly to identify and address any unjustifiable pay inequities.
4.4 Sectoral Targets
Jera Consulting acknowledges that the Minister of Employment and Labour may set sectoral numerical targets for the employment of designated groups. The company will work towards achieving any applicable sectoral targets as published by the Department of Employment and Labour.
5. Scope
This policy applies to:
All employees of Jera Consulting
Job applicants and recruitment processes
Contractors and service providers
All employment practices including recruitment, promotion, training, remuneration, and termination
6. Desired Results and Current Position
6.1 Diversity Profile
Jera Consulting is working towards a workforce profile that reflects the diversity of the South African population, as informed by current census data and labour market demographics. The company recognises that achieving this diversity is an ongoing process that requires sustained commitment and investment.
6.2 Representation Goals
While the company does not maintain rigid numerical targets that override merit-based recruitment, the following aspirational goals guide our employment equity initiatives:
Increase representation of Black employees across all occupational levels
Improve representation of women in senior and technical positions
Create inclusive opportunities for people with disabilities
Develop succession pipelines for designated groups at all levels
7. Policy Principles
7.1 Fair Implementation
Employment equity measures will be implemented fairly and transparently, with clear processes and decision-making criteria. All employment decisions will be documented and subject to review.
7.2 Integration into HR Strategy
Employment equity is integrated into all aspects of human resource management, including:
Workforce planning and analysis
Recruitment and selection
Skills development and training
Career progression and promotion
Remuneration and benefits
Retention and exit management
7.3 Target Groups and Focus Areas
Special attention will be given to:
Recruitment of Black employees, women, and people with disabilities from emerging talent pools
Promotion and advancement of designated group members into senior positions
Skills development and mentoring programs for underrepresented groups
Leadership development for women and Black employees
7.4 No Tokenism
Employment equity initiatives will not result in the appointment or promotion of unqualified individuals. While we seek to advance designated group members, all appointments must be based on merit, competence, and ability to perform the role.
7.5 Skills Pool and Development
The company recognises that historical disadvantage has affected the skills pool available in the labour market. Jera Consulting is committed to investing in the development of employees from designated groups through:
Targeted skills training and mentoring programs
Support for further education and professional development
Internship and graduate recruitment programs
Partnerships with educational institutions
7.6 Diversity Management
Beyond numerical targets, Jera Consulting is committed to creating an inclusive culture where diversity is valued and leveraged for innovation and business success. This includes:
Awareness training on unconscious bias and inclusive leadership
Employee resource groups and affinity networks
Celebration of diversity through company events and communications
Mentoring and sponsorship of underrepresented groups
7.7 Accountability
Senior management is accountable for the achievement of employment equity objectives. Progress will be monitored through:
Regular workforce demographic analysis
Annual employment equity reports to the Department of Employment and Labour
Internal reporting and monitoring of equity metrics
Management performance evaluations that include employment equity objectives
8. Disability Inclusion and Accommodation
Jera Consulting is committed to creating an inclusive workplace for people with disabilities. The company will:
Recruit and promote qualified people with disabilities
Provide reasonable accommodation to enable people with disabilities to perform their duties
Ensure accessibility of physical spaces, technology, and communication
Support employees with disabilities in their career development
Maintain confidentiality of disability information in accordance with POPIA
9. Gender-Based Violence Awareness and Support
The company recognises the impact of gender-based violence on employees and the workplace. Jera Consulting will:
Maintain a zero-tolerance policy for gender-based violence and harassment
Provide information and support for employees affected by gender-based violence
Refer employees to appropriate support services, including counselling and legal assistance
Create a safe reporting mechanism for survivors
Ensure confidentiality and protection from victimisation
10. LGBTQIA+ Inclusion
Jera Consulting is committed to creating an inclusive and affirming workplace for LGBTQIA+ employees. The company will:
Prohibit discrimination based on sexual orientation, gender identity, or gender expression
Provide benefits and leave entitlements that recognise diverse family structures
Support gender transition with reasonable accommodation and discretion
Promote respect and understanding through training and awareness campaigns
Address and prevent harassment and discrimination against LGBTQIA+ employees
11. Key Implementation Areas
11.1 Recruitment and Selection
The company will:
Advertise vacancies to reach diverse candidate pools
Use inclusive recruitment processes that reduce bias
Consider equity goals when shortlisting and selecting candidates
Provide feedback to unsuccessful designated group candidates
11.2 Career Development and Promotion
The company will:
Identify and develop high-potential employees from designated groups
Provide mentoring and sponsorship opportunities
Ensure fair and transparent promotion procedures
Address barriers to advancement for designated group members
11.3 Training and Skills Development
The company will:
Offer targeted training to build skills in underrepresented groups
Fund further education and professional qualifications
Provide leadership development for women and Black employees
11.4 Remuneration and Benefits
The company will:
Conduct regular pay equity audits to ensure equal pay for equal value
Address any identified pay gaps
Offer benefits that are inclusive and non-discriminatory
12. Reporting and Monitoring
Jera Consulting will:
Conduct annual workforce demographic analysis
Report to the Department of Employment and Labour as required by law
Monitor progress against equity objectives
Adjust strategies based on data and feedback
Maintain transparent reporting to employees and stakeholders
13. Grievance and Dispute Resolution
Employees who believe they have been subjected to unfair discrimination or whose employment equity rights have been violated may lodge a formal grievance in accordance with the company''s Employee Relations Policy or refer the matter directly to the Commission for Conciliation, Mediation and Arbitration (CCMA).
14. Legislative Framework
This policy is based on and complies with:
The Employment Equity Act, 1998, as amended by the Employment Equity Amendment Act, 4 of 2022
The Constitution of the Republic of South Africa, 1996
The Labour Relations Act, 1995
The Basic Conditions of Employment Act, 1997
The Broad-Based Black Economic Empowerment Act, 2003
The Protection of Personal Information Act, 2020
15. Implementation and Review
This policy is effective from 1 May 2026. It will be reviewed annually and amended to reflect legislative changes, best practices, and progress towards employment equity objectives.' where id='HR013';
update hr_policies set icon='🤝', summary='This Employee Relations Policy establishes a framework for managing employee discipline, grievances, and disputes at Jera Consulting.', full_text='1. Purpose
This Employee Relations Policy establishes a framework for managing employee discipline, grievances, and disputes at Jera Consulting. The policy is designed to promote fair, consistent, and transparent handling of workplace issues, foster positive employee relations, maintain productive working relationships, and comply with South African labour legislation.
2. Discipline Policy
2.1 Objective
The objective of disciplinary action is to:
Correct unacceptable or misconduct behaviour
Encourage compliance with company policies and procedures
Maintain workplace standards and productivity
Support employee improvement and development
Ensure fair and consistent application of standards
2.2 Principles of Discipline
All disciplinary action will be based on the following principles:
Fairness: All employees will be treated fairly and consistently
Natural Justice: Employees have the right to be heard before action is taken
Proportionality: Discipline will be proportionate to the misconduct
Documentation: All disciplinary action will be documented
Transparency: Procedures will be clear and communicated in advance
2.3 Scope of Misconduct
Misconduct includes, but is not limited to:
Insubordination or refusal to comply with lawful instructions
Absenteeism or unauthorised absence
Poor performance or failure to meet standards
Dishonesty, theft, or fraud
Breach of confidentiality or misuse of company information
Violation of health and safety procedures
Harassment, bullying, or discrimination
Sexual harassment or creating a hostile work environment
Use of company equipment or systems for personal gain
Misconduct while representing the company
3. Discipline Procedures
3.1 Informal Warnings
For minor misconduct, an informal warning may be given verbally. The employee will be:
Informed of the unacceptable behaviour
Given an opportunity to respond
Advised of expectations going forward
Told that continued misconduct will result in formal action
3.2 Formal Disciplinary Hearings
For more serious misconduct, a formal disciplinary hearing will be held. The employee will be:
Notified in writing of the alleged misconduct with sufficient detail and notice
Given the right to legal representation or union representation
Provided with an opportunity to present their case
Given access to evidence against them
Allowed to cross-examine witnesses
A disciplinary hearing will be conducted by a senior manager or an independent disciplinarian, documented in writing, and a decision communicated in writing to the employee.
3.3 Disciplinary Outcomes
Depending on the nature and severity of misconduct, disciplinary outcomes may include:
Verbal or written warning
Suspension (with or without pay)
Fine or salary deduction (where legally permissible)
Demotion or transfer
Dismissal
3.4 Right of Appeal
An employee may appeal any disciplinary decision within 10 working days. Appeals will be heard by a senior manager not previously involved in the matter.
4. Grievance Policy
4.1 Objective
The objective of this grievance policy is to:
Provide employees with a fair and accessible process to raise concerns
Resolve workplace issues promptly and fairly
Maintain positive working relationships
Prevent unresolved issues from escalating
4.2 Scope of Grievances
A grievance is a complaint by an employee relating to their employment, including:
Alleged unfair treatment or management decisions
Non-compliance with policies or procedures
Breach of contract or terms and conditions
Harassment or discrimination
Health and safety concerns
Pay or benefits issues
Workplace conflicts or tensions
5. Grievance Procedures
5.1 Informal Resolution
Employees are encouraged to attempt informal resolution first by:
Speaking directly with their manager or supervisor
Seeking assistance from Human Resources
Using mediation or conflict resolution services
Many workplace issues can be resolved informally without formal proceedings.
5.2 Formal Grievance Process
If informal resolution is not possible or unsuccessful, an employee may lodge a formal grievance by:
Submitting a written grievance to Human Resources or their manager within 30 days of the issue arising
Detailing the nature of the grievance, relevant facts, and desired outcome
Providing supporting documentation where available
5.3 Grievance Investigation and Hearing
Upon receipt of a formal grievance, Human Resources will:
Acknowledge receipt within 5 working days
Conduct a fair and impartial investigation
Meet with the aggrieved employee to gather information
Meet with the respondent to hear their side
Interview relevant witnesses
Review all evidence and documentation
5.4 Grievance Resolution
Human Resources will attempt to resolve the grievance through conciliation, negotiation, or mediation. If resolution is not achieved, the matter may be escalated to formal arbitration or referred to the CCMA.
5.5 Timeline
Formal grievances will be addressed within 30 days where possible. Complex matters may require extension, which will be communicated to the employee.
6. Trade Union Rights
Jera Consulting recognises the rights of employees to:
Form or join a trade union or employee organisation
Participate in lawful union activities
Be represented by a union in disciplinary and grievance proceedings
Strike for lawful purposes in accordance with the Labour Relations Act
The company will not discriminate against or victimise employees for exercising these rights.
7. Consultation and Communication
The company is committed to:
Regular communication with employees on matters affecting their employment
Consulting with employee representatives on significant workplace changes
Maintaining an open-door policy for employee concerns
Providing clear and transparent communication on policies and procedures
8. Workplace Harassment and Bullying
8.1 Zero Tolerance Policy
Jera Consulting maintains a zero-tolerance policy for harassment and bullying in the workplace, including:
Sexual harassment and unwanted sexual conduct
Racial or ethnic harassment
Harassment based on disability, age, or any other protected characteristic
Bullying, intimidation, or threatening behaviour
Verbal or physical abuse
8.2 Definition of Sexual Harassment
In accordance with the Code of Good Practice for the Elimination of Sexual Harassment and Unfair Discrimination, sexual harassment includes:
Unwanted verbal conduct of a sexual nature
Unwanted non-verbal conduct of a sexual nature
Unwanted physical conduct of a sexual nature
Sexual harassment may include conduct by the same gender and does not require intent to harass.
8.3 Reporting Harassment
Employees may report harassment to:
Their direct manager or supervisor
Human Resources
A designated grievance officer
The CCMA or any other relevant authority
All reports will be treated confidentially and investigated promptly.
9. Digital Communication and Social Media
9.1 Professional Conduct Online
Employees are expected to maintain professional standards in digital communications, including email, instant messaging, and video calls. Unprofessional, harassing, or discriminatory messages may result in disciplinary action.
9.2 Social Media Misconduct
While employees are entitled to personal social media use, conduct that:
Brings the company into disrepute
Violates confidentiality or intellectual property
Constitutes harassment or discrimination
Misrepresents the company or its policies
may result in disciplinary action.
10. Strike and Lock-Out Policy
10.1 Right to Strike
Employees have the right to strike for lawful purposes as provided in the Labour Relations Act. Strikes must follow proper procedures, including notice to the employer and mediation where required.
10.2 Company Rights
The company has the right to implement a lock-out in response to a strike, subject to proper procedure and notice.
10.3 Strike Procedure
During any strike or industrial action:
Essential services will be maintained
No employee will be victimised for participating in a lawful strike
Negotiations will be conducted in good faith
The matter may be referred to the CCMA for mediation or arbitration if necessary
11. Dispute Resolution and CCMA
11.1 Alternative Dispute Resolution
The company is committed to resolving disputes promptly through negotiation and mediation before involving external bodies.
11.2 CCMA Referral
If internal procedures do not resolve a dispute, either party may refer the matter to the Commission for Conciliation, Mediation and Arbitration (CCMA) in accordance with the Labour Relations Act. The CCMA will:
Attempt to resolve the dispute through conciliation
Conduct a hearing and issue an award if conciliation is unsuccessful
Determine remedies in cases of unfair dismissal or unfair labour practice
11.3 Virtual and Online Dispute Resolution
Post-COVID, the CCMA has developed procedures for virtual conciliation and arbitration hearings. The company will participate in such processes where required, ensuring fair and transparent proceedings.
11.4 Labour Court
Certain disputes may be referred to the Labour Court, including reviews of CCMA awards and constitutional matters. The company will pursue justice through the appropriate courts as necessary.
12. Training and Development
The company will:
Provide training to managers on fair and legal discipline and grievance handling
Ensure Human Resources staff are trained in current labour law and best practices
Offer training to employee representatives on their rights and responsibilities
Communicate this policy to all employees during onboarding
13. Labour Legislation Framework
This policy is based on and complies with:
The Labour Relations Act, 1995, as amended
The Basic Conditions of Employment Act, 1997
The Employment Equity Act, 1998, as amended
The Occupational Health and Safety Act, 1985
The Code of Good Practice for the Elimination of Sexual Harassment and Unfair Discrimination
All applicable CCMA and Labour Court judgments and procedures
14. Implementation and Review
This policy is effective from 1 May 2026 and will be reviewed annually or in response to legislative changes or operational requirements.' where id='HR014';
update hr_policies set icon='🦺', summary='Jera Consulting is committed to providing a safe and healthy working environment for all employees, contractors, clients, and visitors.', full_text='1. Introduction
Jera Consulting is committed to providing a safe and healthy working environment for all employees, contractors, clients, and visitors. This Occupational Health and Safety Policy establishes the framework for managing health and safety risks and complying with the Occupational Health and Safety Act, 1993, and related legislation.
2. Objective
To:
Prevent work-related injuries, illnesses, and fatalities
Ensure compliance with occupational health and safety legislation
Create a workplace culture where health and safety are valued priorities
Provide safe systems of work and safe working conditions
Promote employee wellness and mental health
Respond promptly to incidents and hazards
3. Governing Principles
3.1 Legal Framework
This policy is underpinned by:
The Occupational Health and Safety Act, 85 of 1993
The Compensation for Occupational Injuries and Diseases Act, 130 of 1993, as amended
The Occupational Diseases in Mines and Works Act (ODMWA)
The Basic Conditions of Employment Act, 1997
Applicable provincial and local regulations
3.2 Principle of Prevention
The company adopts a preventive approach to health and safety, prioritising elimination of hazards before implementing control measures.
3.3 Worker Participation
Employees and their representatives will be actively involved in identifying and controlling health and safety hazards through health and safety committees and regular consultation.
4. Scope
This policy applies to:
All employees of Jera Consulting
Contractors and temporary workers
All workplaces where company activities are undertaken
All work-related activities and events
Remote and hybrid work arrangements
5. Policy Provisions
5.1 Employer Responsibilities
Jera Consulting is responsible for:
Providing and maintaining a safe working environment
Ensuring equipment and machinery are safe and regularly maintained
Providing necessary training, information, and supervision
Identifying and assessing hazards and risks
Implementing control measures to eliminate or minimise risks
Providing personal protective equipment (PPE) where necessary
Maintaining incident and injury records
Investigating and reporting incidents
Conducting regular workplace inspections
Ensuring first aid and medical facilities are available
Supporting employees affected by work-related illness or injury
5.2 Employee Responsibilities
All employees are responsible for:
Complying with health and safety instructions and procedures
Using equipment and PPE correctly and safely
Reporting hazards and incidents to their manager
Taking reasonable care of their own health and safety
Participating in training and health and safety activities
Not interfering with safety equipment or guards
Maintaining a clean and orderly workplace
Raising concerns if they believe work is unsafe
5.3 Health and Safety Representatives
The company will facilitate the appointment of health and safety representatives to:
Represent employee interests in health and safety matters
Investigate hazards and complaints
Conduct workplace inspections
Participate in health and safety committee meetings
Provide feedback to employees on safety matters
Representatives will be given time and resources to perform their duties and will not be victimised for raising concerns.
5.4 Health and Safety Committee
A Health and Safety Committee will be established comprising:
Management representatives
Employee representatives or union delegates
A health and safety representative (where elected)
The committee will meet quarterly to:
Review health and safety performance
Discuss hazards and incidents
Develop and implement safety initiatives
Monitor compliance with policies and procedures
6. Hazard Identification and Risk Assessment
The company will:
Conduct regular hazard identification and risk assessments
Assess risks based on severity and likelihood
Implement control measures aligned with the hierarchy of controls
Monitor effectiveness of controls
Review assessments when work processes or conditions change
7. Control Measures
The company will implement control measures in the following order of preference:
Elimination: Remove the hazard entirely
Substitution: Replace with a less hazardous substance or process
Engineering controls: Modify the workplace or equipment
Administrative controls: Change work procedures or practices
Personal protective equipment: Provide PPE as a last resort
8. COVID-19 and Pandemic Preparedness
Jera Consulting has implemented measures to protect employees during COVID-19 and other pandemics:
Regular cleaning and sanitisation of offices
Provision of hand sanitiser and hygiene supplies
Flexible remote work arrangements where possible
Vaccination support and information
Rapid response protocols for suspected cases
Communication of health advice and updates
The company will continue to monitor public health guidance and adjust measures accordingly.
9. Remote Work Health and Safety
9.1 Remote Work Risk Assessment
Employees working from home will:
Provide details of their remote work location
Undergo a home office ergonomic assessment
Receive advice on safe work practices
9.2 Ergonomic Home Office Assessments
The company will:
Provide guidance on ergonomic home office setup
Offer assessments to identify risks
Provide or subsidise ergonomic equipment (desk, chair, monitor)
Advise on proper working posture and break times
Employees should report musculoskeletal pain or discomfort to management promptly.
9.3 Remote Work Expectations
Remote work policies will include:
Reasonable expectations for response times and availability
Right to disconnect outside working hours
Prevention of overwork and burnout
Clear communication channels for reporting hazards
10. Mental Health and Wellness
The company is committed to supporting mental health in the workplace:
Providing access to Employee Assistance Programme (EAP) services
Training managers to recognise and respond to mental health concerns
Creating a supportive and inclusive work environment
Reducing stigma associated with mental health issues
Offering wellness programs and stress management resources
Supporting employees experiencing stress, anxiety, or depression
Managing workload to prevent burnout
11. Workplace Violence Prevention
The company will:
Maintain a zero-tolerance policy for violence or threats
Identify locations and situations where violence risk is elevated
Implement security measures and controls
Train employees on de-escalation and reporting procedures
Support victims of workplace violence
Investigate incidents and refer to law enforcement where appropriate
12. First Aid and Medical Facilities
The company will:
Designate trained first aiders
Maintain a fully stocked first aid kit
Provide access to medical care in emergencies
Maintain relationships with healthcare providers
Ensure employees know how to access emergency medical services
13. Incident Reporting and Investigation
13.1 Incident Definition
An incident includes:
Any injury or illness arising from work
Near misses (incidents that could have resulted in injury)
Unsafe conditions or hazards
Exposure to hazardous substances
13.2 Immediate Reporting
Employees must report all incidents to their manager immediately or as soon as practicable.
13.3 Digital Incident Reporting
Incidents may be reported using:
Digital incident reporting forms via email or online system
Direct communication to management or Human Resources
Anonymous reporting mechanisms (if available)
13.4 Investigation
All incidents will be investigated to:
Determine the cause
Identify contributing factors
Implement corrective actions
Prevent recurrence
13.5 Record Keeping
The company will:
Maintain records of all incidents and injuries
Complete required statutory notifications
Retain records for the prescribed period
14. Health and Safety Training
The company will:
Provide induction training to all new employees
Conduct role-specific training and competency assessments
Offer refresher training at regular intervals
Train all workers on relevant hazards and controls
Ensure health and safety representatives receive training
Document all training provided
15. Workplace Inspections and Maintenance
The company will:
Conduct regular workplace inspections
Maintain equipment and machinery in safe working order
Keep facilities clean and well-maintained
Address any identified hazards promptly
Document inspections and maintenance activities
16. Health and Safety Performance Monitoring
The company will:
Track incidents and injury rates
Monitor near-misses and hazard reports
Review health and safety metrics regularly
Set targets for performance improvement
Report performance to senior management
Adjust programs based on performance data
17. Contractor and Vendor Management
All contractors and vendors must:
Comply with this health and safety policy
Provide evidence of appropriate qualifications and insurance
Undergo site-specific safety induction
Maintain safe work practices on company premises
18. Occupational Hygiene and Health Surveillance
Where required, the company will:
Conduct occupational hygiene monitoring
Provide health surveillance (medical assessments) for employees
Maintain records in compliance with COIDA and ODMWA
Refer employees for specialist assessment where necessary
19. Substance Abuse in the Workplace
The company will:
Maintain a zero-tolerance policy for substance abuse at work
Provide information and education on substance abuse risks
Support employees seeking treatment through EAP services
Conduct random testing in safety-sensitive roles where appropriate
20. Legislative Framework
This policy is based on and complies with:
The Occupational Health and Safety Act, 85 of 1993
The Compensation for Occupational Injuries and Diseases Act, 130 of 1993, as amended
The Occupational Diseases in Mines and Works Act
The Basic Conditions of Employment Act, 1997
The National Environmental Management Act
Applicable provincial and local health and safety regulations
21. Implementation and Review
This policy is effective from 1 May 2026. All employees will receive training and communication regarding this policy. It will be reviewed annually and amended to reflect legislative changes, incident trends, and best practices.
22. Commitment from Management
Senior management is committed to health and safety and will:
Allocate appropriate resources and budget
Support health and safety initiatives
Lead by example in safe work practices
Hold managers accountable for health and safety performance
Communicate the importance of health and safety to all staff' where id='HR015';
update hr_policies set icon='⚠️', summary='To establish a fair, transparent and consistent disciplinary procedure that promotes good conduct and accountability in the workplace, while afford…', full_text='1. Objective
To establish a fair, transparent and consistent disciplinary procedure that promotes good conduct and accountability in the workplace, while affording employees the right to natural justice in accordance with the Labour Relations Act, 66 of 1995 (LRA).
2. Guiding Principles
Fairness and Natural Justice: Employees have the right to a fair hearing and representation.
Transparency: Clear communication of expectations and consequences.
Progressive Discipline: Escalation from informal warnings through formal dismissal.
Proportionality: Penalties must be commensurate with the offence.
Consistency: Similar offences treated uniformly across the organisation.
Rehabilitation: Discipline aims to correct behaviour, not purely punish.
Compliance: Adherence to South African labour law and CCMA standards.
3. Definitions
Misconduct
Wilful or negligent failure to comply with company policies, procedures, or lawful instructions, or conduct that is incompatible with the satisfactory performance of duties or good faith employment relationship.
Gross Misconduct
Serious breaches of conduct that warrant summary dismissal without notice, including theft, violence, dishonesty, and deliberate sabotage.
Digital Misconduct
Unauthorised access to company systems, misuse of company IT resources, cyberbullying, inappropriate social media conduct related to the company, sharing of confidential information digitally, and violations of POPIA (Protection of Personal Information Act, 2013).
4. Disciplinary Code
4.1 Classification of Offences
Category A: Assault and Violence
Physical assault on any person on company premises or during company business.
Threats of violence or intimidating behaviour.
First offence: Final Written Warning or Dismissal.
Category B: Breach of Good Faith
Violation of confidentiality agreements.
Disclosure of sensitive commercial information.
Failure to declare conflicts of interest.
First offence: Written Warning | Second offence: Final Written Warning | Third offence: Dismissal.
Category C: Damage to or Loss of Company Property
Negligent or wilful damage to company property.
Theft or loss of company assets.
Unauthorised use of company property.
First offence: Written Warning (if negligent) or Final Written Warning (if wilful) | Subsequent: Dismissal.
Category D: Theft and Dishonesty
Theft of company or colleague property.
Falsification of records or documents.
Fraudulent claims or false expense submissions.
First offence: Final Written Warning or Dismissal.
Category E: Timekeeping and Attendance
Habitual lateness or absenteeism.
Unauthorised absence.
First offence: Verbal Warning | Second offence: Written Warning | Third offence: Final Written Warning | Fourth offence: Dismissal.
Category F: Insubordination
Refusal to follow lawful management instructions.
Disrespect or defiance toward supervisors or management.
Deliberate non-compliance with established procedures.
First offence: Written Warning | Second offence: Final Written Warning | Third offence: Dismissal.
Category G: Intoxication and Substance Abuse
Being under the influence of alcohol or illegal drugs at work.
Possession of alcohol or drugs on company premises.
Refusal to undergo substance testing.
First offence: Final Written Warning or Dismissal (depending on circumstances and safety risk).
Category H: Weapons on Company Premises
Possession of firearms, knives, or other weapons.
Threat to use weapons.
First offence: Dismissal.
Category I: Absence Without Leave (AWOL)
Unauthorised absence exceeding 3 consecutive days.
Pattern of unexcused absences.
First offence (3 days): Written Warning | Subsequent: Final Written Warning or Dismissal.
Category J: Safety Violations
Failure to comply with health and safety procedures.
Reckless conduct endangering self or others.
Failure to wear required safety equipment.
First offence: Written Warning (if technical) | Final Written Warning (if reckless) | Dismissal (if wilful endangerment).
Category K: Disrespect and Unprofessional Conduct
Use of abusive or offensive language.
Harassment or bullying of colleagues.
Sexual harassment or gender-based violence.
First offence: Written Warning | Second offence: Final Written Warning | Third offence: Dismissal.
Category L: Criminal Matters
Conviction of a crime relevant to employment (fraud, theft, violence, etc.).
Criminal charges that materially affect job performance or company reputation.
First offence: Final Written Warning or Dismissal.
Category M: Digital Misconduct
Unauthorised access to company systems or data.
Hacking, phishing attempts, or malware introduction.
Misuse of company IT resources (excessive personal use, accessing prohibited sites).
Cyberbullying or threatening conduct via digital channels.
Sharing confidential company information via email, messaging, or social media.
Violations of POPIA (handling personal data without consent or inappropriately).
Impersonation of company officials online.
First offence: Written Warning (if unintentional) | Final Written Warning (if deliberate misuse) | Dismissal (if malicious).
Category N: Other Misconduct
Any other conduct not listed but deemed incompatible with satisfactory employment.
Disciplinary action determined based on severity and context.
5. Disciplinary Procedure
5.1 Verbal Warning (Informal)
For minor first offences. Manager to:
Speak to employee privately and immediately.
Explain the breach and expected behaviour.
Document the conversation (date, time, topic, outcome).
Validity period: 3 months from date of warning.
5.2 Written Warning (Formal)
For repeated minor offences or more serious first offences. Manager to:
Issue written warning documenting offence, policy violated, and expected improvement.
Grant employee 5 working days to respond in writing.
Validity period: 6 months from date of warning.
Copy placed on employee''s personnel file.
5.3 Final Written Warning
For continued breaches or serious misconduct. Procedure:
Issue final written warning with clear statement that further misconduct may lead to dismissal.
Employee has 5 working days to submit written response.
Validity period: 12 months from date of warning.
Placed on personnel file.
5.4 Dismissal
For gross misconduct or repeated breaches despite warnings.
Disciplinary hearing must be held prior to dismissal (unless summary dismissal applies).
Dismissal confirmed in writing with reasons.
Notice period as per employment contract or BCEA (minimum 4 weeks for employees with >1 year service).
6. Disciplinary Hearing Procedure
6.1 Notification
Employee must receive written notice containing:
Date, time, and venue of hearing.
Details of the alleged misconduct.
Policy or procedure allegedly breached.
Right to representation by a union representative or co-employee.
Minimum 48 hours'' notice (or as agreed).
6.2 Representation
Employee may be represented by a union representative (if a union member) or a co-employee. Legal representation typically not permitted unless case involves complex legal issues.
6.3 Hearing Conduct
Chairperson (senior manager or HR representative) presents case.
Employee afforded opportunity to respond to allegations.
Witnesses may be called by both parties.
Virtual or remote hearings permissible if agreed or circumstances require.
Hearing conducted professionally and objectively.
6.4 Decision and Sanction
Following hearing, chairperson to:
Evaluate evidence presented.
Determine whether misconduct has been proven on a balance of probabilities.
If proven, apply progressive discipline.
Issue decision in writing within 5 working days.
Communicate outcome to employee, representation, and HR.
7. Suspension Pending Investigation
Employer may suspend employee on full pay while investigation or disciplinary process is underway, provided:
Suspension is not punitive in nature.
Duration is reasonable (typically not exceeding 30 days without review).
Employee remains on full salary and benefits.
Written notice provided.
Intended to prevent interference with investigation or risk to business.
8. Right of Appeal
Employee may appeal a disciplinary decision within 5 working days of receiving written outcome.
Appeal must be submitted in writing to the next level of management or HR.
Appeal hearing must be conducted by manager not involved in original decision.
Decision on appeal communicated in writing within 5 working days.
9. CCMA Referral
If employee disputes the fairness or validity of dismissal, they may refer the matter to the Commission for Conciliation, Mediation and Arbitration (CCMA) within 30 days of dismissal, in accordance with s191 of the LRA.
10. Employee Rights
Right to fair hearing with natural justice.
Right to representation.
Right to respond to allegations.
Right to appeal.
Right to access all relevant documentation.
Right to protection against victimisation.
Right to confidentiality (to extent possible).
11. Chairperson Checklist
Is the allegation clearly stated and substantiated?
Has employee been afforded opportunity to respond?
Has representation been arranged?
Is the evidence credible and sufficient?
Is the penalty proportionate to the offence?
Are other similar cases treated consistently?
Has the company followed its own procedure?
Is dismissal a fair sanction under the circumstances?
Has all relevant evidence been considered?
Are there mitigating factors?' where id='HR016';
update hr_policies set icon='📢', summary='This policy establishes a comprehensive framework for employees to voice grievances and concerns in the workplace in a fair, timely, and confidenti…', full_text='1. Introduction
This policy establishes a comprehensive framework for employees to voice grievances and concerns in the workplace in a fair, timely, and confidential manner. Grievance procedures ensure that all employee concerns are heard, investigated, and resolved equitably.
2. Objective
To provide employees with a structured mechanism to raise concerns or complaints about their employment, treatment, or working conditions, whilst protecting both employee interests and the company''s operational integrity.
3. General Principles
Accessibility: Grievance procedures must be accessible to all employees regardless of tenure, position, or status.
Confidentiality: All grievances handled confidentially, with information shared only on a need-to-know basis.
Impartiality: Grievances investigated by independent, impartial personnel without conflict of interest.
Timeliness: Grievances addressed promptly within prescribed timeframes.
Anti-victimisation: No employee shall face victimisation, retaliation, or adverse action for lodging a genuine grievance.
Natural Justice: Employee afforded opportunity to state their case and respond to allegations.
Documentation: All proceedings recorded and maintained on personnel files.
Remedy: Where upheld, grievances result in fair remedial action.
4. Definition of Grievance
A grievance is any formal complaint, concern, or dissatisfaction raised by an employee regarding:
Working conditions or environment.
Treatment by management or colleagues.
Alleged breach of contract or company policy.
Alleged unfair or discriminatory action.
Sexual harassment or gender-based violence.
Health and safety concerns.
Alleged victimisation or retaliation.
Any other matter materially affecting the employment relationship.
5. Scope
This procedure applies to all employees of Jera Consulting. Grievances involving statutory matters (unfair dismissal, discrimination under EEA, etc.) may be referred directly to the CCMA if internal procedures fail.
6. Grievance Procedure
6.1 Stage 1: Immediate Manager
Employee should first attempt to resolve the matter informally with their immediate manager.
Employee raises concern verbally or in writing to immediate manager.
Manager listens and seeks to understand the grievance.
Manager to respond within 5 working days with proposed resolution.
If resolved informally, matter is documented and filed.
If not resolved, employee may escalate to Stage 2.
6.2 Stage 2: Formal Grievance Lodgement
If informal resolution fails, employee may lodge formal grievance using Grievance Form.
Complete Form A (Grievance Lodgement Form) detailing:
Nature of grievance and relevant dates.
People involved and witnesses.
Outcomes sought.
Evidence or supporting documentation.
Submit form to HR Manager or designated grievance officer.
Submission confirms grievance is received (acknowledge within 2 working days).
HR Manager convenes formal hearing within 10 working days.
6.3 Stage 2 Hearing
Employee and representation (union rep or co-employee) attend hearing.
HR Manager or independent investigator chairs the hearing.
Employee presents grievance and evidence.
Respondent (if applicable) presents their account.
Witnesses examined.
Virtual hearings permitted if agreed or necessary.
Hearing documented (minutes recorded).
6.4 Stage 2 Decision
Investigator/HR Manager reviews evidence.
Decision issued in writing within 5 working days of hearing.
Decision states:
Whether grievance is upheld, partially upheld, or dismissed.
Reasons for decision.
Remedial action (if upheld).
Right of appeal.
Decision communicated to employee, respondent, and representatives.
6.5 Stage 3: Appeal
Employee may appeal decision within 5 working days of receiving written decision.
Appeal submitted to Managing Director or designated senior manager.
Appeal hearing held within 10 working days.
Appeal panel must not have been involved in original decision.
Appeal decision is final and issued in writing within 5 working days.
7. Special Grievance Channels
7.1 Sexual Harassment and Gender-Based Violence
In terms of the Code of Good Practice on Sexual Harassment, a dedicated channel exists for sexual harassment and GBV grievances.
Grievances may be reported to HR Manager, senior management, or external designated officer.
Reports treated with heightened confidentiality and sensitivity.
Investigation conducted immediately with trained investigator.
Interim protective measures implemented (reassignment, leave, etc.) if necessary.
No victimisation of complainant or witnesses.
Outcomes communicated within statutory timeframes.
7.2 Anonymous Grievance Reporting
Employees may lodge anonymous grievances via:
Anonymous grievance box (physical or digital).
Third-party hotline (if implemented).
Anonymous submission to HR Manager marked ''Confidential''.
Anonymous grievances will be investigated to the extent possible, though limited details may impact investigation depth.
8. Whistleblower Protection
Employees who report alleged misconduct or breaches in good faith are protected from victimisation under the Protected Disclosures Act, 26 of 2000 (as amended).
Protected disclosures include reports of:
Regulatory violations.
Fraud or corruption.
Health and safety breaches.
Environmental violations.
Criminal conduct.
Whistleblowers may not be dismissed, demoted, harassed, or disciplined in retaliation for protected disclosures.
9. Time Limits
Grievance Lodgement Timeframe
Grievances should be lodged within 30 days of the incident or discovery of the grievance. The company may consider grievances lodged outside this period at its discretion, but delay may result in inability to investigate properly.
Response Timeframes
All responses to grievances must be provided within prescribed timeframes:
Informal resolution: 5 working days.
Formal hearing: Scheduled within 10 working days of lodgement.
Decision: Within 5 working days of hearing.
Appeal hearing: Scheduled within 10 working days of appeal lodgement.
Appeal decision: Within 5 working days of hearing.
Extensions
Timeframes may be extended by written agreement if circumstances warrant (e.g., complexity of investigation, witness availability).
10. CCMA Referral
If a grievance involves alleged unfair labour practice (e.g., unfair treatment, discrimination, wrongful suspension), unresolved after internal procedures, the employee may refer the matter to the CCMA within 30 days of the alleged violation (or 30 days from final internal decision), in accordance with s191 of the LRA.
11. Anti-Victimisation and Protected Rights
Jera Consulting strictly prohibits victimisation or retaliation against any employee for:
Lodging a genuine grievance.
Participating as a witness or representative in a grievance process.
Providing information during investigation.
Making a protected disclosure.
Any form of retaliation is a serious disciplinary matter and may result in dismissal.
12. Documentation and Record Keeping
All grievance matters are documented and filed on the employee''s personnel file or in a secure grievance register, including:
Grievance form and supporting documents.
Hearing notes and minutes.
Written decisions.
Appeal proceedings.
Remedial actions taken.
Files maintained confidentially and retained for 3 years post-resolution per POPIA requirements.
13. Confidentiality
All parties to a grievance process must maintain confidentiality regarding the substance of the grievance, hearing proceedings, and decision, except where:
Disclosure is necessary for implementation of remedial action.
Required by law or regulatory authority.
Necessary to protect health and safety.
Required for CCMA or legal proceedings.
14. Grievance Forms
Form A: Grievance Lodgement Form
Employee Name and ID.
Date of Lodgement.
Nature of Grievance (detailed description).
Relevant dates and people involved.
Witnesses.
Outcome sought.
Supporting documents attached.
Employee signature and date.
Form B: Notice of Grievance Hearing
Hearing date, time, and venue.
Summary of grievance.
Right to representation.
Submission deadline for additional evidence.
Form C: Grievance Decision Form
Date and hearing details.
Findings on evidence.
Decision (upheld/partially upheld/dismissed).
Remedial action (if applicable).
Appeal rights and deadline.
Decision maker signature and date.' where id='HR017';
update hr_policies set icon='📋', summary='This policy governs the termination of employment relationships between employees and Jera Consulting, whether by resignation, dismissal, retiremen…', full_text='1. Introduction
This policy governs the termination of employment relationships between employees and Jera Consulting, whether by resignation, dismissal, retirement, or other circumstances. The policy ensures compliance with applicable South African labour legislation and protects both employee and employer interests.
2. Objective
To establish clear procedures for the termination of employment, ensuring fair treatment, legal compliance, and orderly transition of employee responsibilities.
3. Scope
This policy applies to all employees of Jera Consulting, including permanent, fixed-term, and probationary employees.
4. Applicable Legislation
This policy operates within the framework of:
Basic Conditions of Employment Act, 75 of 1997 (BCEA) - notice periods, final payment.
Labour Relations Act, 66 of 1995 (LRA) - dismissal fairness, referrals to CCMA.
Employment Equity Act, 55 of 1998 (EEA) - discrimination protections.
Protection of Personal Information Act, 4 of 2013 (POPIA) - data handling on termination.
5. Types of Termination
5.1 Resignation
An employee may resign by providing written notice to their manager and HR.
Notice periods as per BCEA s37:
Less than 6 months service: 1 week''s notice.
6 to 12 months service: 2 weeks'' notice.
More than 1 year service: 4 weeks'' notice.
Resignation effective from the date the notice period expires. Resignation may be withdrawn in writing before the notice period expires, at the discretion of the company.
5.2 Dismissal
Dismissal is termination by the employer. Requires:
Fair reason (e.g., misconduct, incapacity, operational requirements).
Fair procedure (disciplinary hearing or consultation as appropriate).
Compliance with notice periods or payment in lieu.
Unfair dismissal may be challenged at the CCMA within 30 days.
5.3 Retirement
Retirement is voluntary termination by an employee at the end of their working life.
South African law does not mandate a fixed retirement age; retirement age is determined by employment contract (typically 60-65). Employer and employee may agree to vary the retirement age contractually.
Retirement benefits (pension, provident fund) disbursed in accordance with fund rules.
5.4 Other Termination
Includes:
Death of employee (immediate termination).
Abscondment (absence without leave exceeding 30 days treated as abandonment; employer may terminate after investigation).
Desertion (employee indicates intention to abandon employment).
Mutual agreement to terminate (requires written agreement).
6. Notice and Notice Periods
6.1 Notice Requirement
Termination by either party must be communicated in writing to the other party, unless immediate termination applies (summary dismissal for gross misconduct).
6.2 Notice Periods (BCEA s37)
Standard notice periods:
Less than 6 months service: 1 week.
6 months to 12 months service: 2 weeks.
12 months or longer service: 4 weeks.
Notice periods commence from the date of receipt of notice. Notice may be given on any day of the week.
6.3 Payment in Lieu of Notice
Employer may pay the employee in lieu of working the notice period, provided the employee agrees or the employment contract permits. Payment calculated as ordinary remuneration for the notice period.
6.4 Garden Leave
During notice period, employer may direct employee to remain away from the workplace while continuing to pay salary and benefits. This is permissible where:
Protecting confidential information.
Preventing disruption or distraction of other employees.
Preventing damage to business relationships or reputation.
Garden leave must be compensated fully (no salary reduction).
7. Final Payment
In accordance with BCEA s33, final payment must be made within 7 days of termination date and must include:
Accrued salary to date of termination.
Accrued annual leave (if not taken).
Accrued sick leave (where company policy provides payout).
Severance pay (if applicable).
Any other contractual payments due.
Final payment may be subject to deduction of:
Income tax (as per tax tables).
Legitimate debts owed by employee to company (with written agreement).
Court orders or garnishees.
A detailed final payslip must be provided itemising all deductions.
8. Return of Company Property
Prior to final payment, employee must return all company property, including:
Laptop, phone, and other IT equipment.
Access cards, keys, and security devices.
Company vehicle (if issued).
Uniforms or branded clothing.
Confidential documents or files.
Employee responsible for all property. Damaged or missing items may result in deduction from final pay (if contractually permitted and reasonable).
9. Certificate of Service
Employer must issue a Certificate of Service to the employee upon termination, as required by BCEA s39.
Certificate must include:
Employee name and ID number.
Position and department.
Start date and termination date.
Period of employment.
Reason for termination (if applicable).
Employer name and details.
Date of issue.
Certificate must be accurate and provided within 3 days of termination.
10. Restraint of Trade
If employment contract includes a restraint of trade clause, it remains binding on the employee after termination if:
Clause is reasonable in scope, duration, and geographic area.
Protects legitimate business interests (trade secrets, client relationships, competition).
Does not impose undue hardship on employee.
Employer may seek enforcement via court injunction. Reasonableness assessed by the courts.
11. Tax Compliance
Upon termination, employer issues:
IRP5/IT3(a) (tax certificate) by 28 February following tax year.
Tax clearance letter (if employee requests).
Employee responsible for declaring termination pay to SARS and any tax due thereon.
12. POPIA Compliance on Termination
Upon termination, employer must:
Delete personal information no longer required (after retention periods expire).
Maintain records required by law (e.g., tax records for 5 years).
Ensure data security for records retained.
Notify employee of data retention and deletion practices.
Cease communication on personal contact details unless consent obtained.
13. Exit Interview
Where practicable, employer conducts exit interview with departing employee to:
Gather feedback on employment experience.
Identify areas for improvement in company practices.
Clarify post-employment obligations (confidentiality, restraint, etc.).
Confirm final arrangements (references, forwarding address).
Exit interviews may be conducted in-person or digitally.
14. Post-Employment Obligations
Upon termination, employee must:
Comply with confidentiality and non-disclosure agreements.
Comply with restraint of trade provisions (if applicable).
Return all company property.
Cooperate with knowledge transfer or handover process.
Not represent themselves as employed by the company.
Not disparage the company publicly.
15. References
Employer provides references for departing employees upon request. References limited to factual information (dates of employment, positions held, final salary). Subjective assessments discouraged to avoid defamation claims.
16. Pension and Benefits
Upon termination:
Pension/provident fund contributions cease.
Medical aid coverage ends on date of termination (or month-end, per benefit rules).
Vested benefits payable per fund rules and legislation.
Employee notified of fund contact details for claims.
17. Unfair Dismissal Remedy
Employees dismissed without fair reason or procedure may refer disputes to the CCMA within 30 days of dismissal. The CCMA may order:
Reinstatement (with or without compensation).
Compensation for unfair dismissal.
Payment of benefits.' where id='HR018';
update hr_policies set icon='📉', summary='Retrenchment is the termination of employment by the employer for operational reasons unrelated to the conduct of the employee.', full_text='1. Introduction
Retrenchment is the termination of employment by the employer for operational reasons unrelated to the conduct of the employee. This policy establishes a framework for retrenchments in compliance with Section 189 of the Labour Relations Act, 66 of 1995, ensuring fair treatment, transparent selection criteria, and appropriate severance compensation.
2. Objective
To provide a structured, transparent, and legally compliant process for managing retrenchments, protecting employee interests whilst enabling the company to adapt to operational changes.
3. Principles
Fairness: Retrenchment decisions based on objective criteria applied consistently.
Transparency: Clear communication of reasons and selection criteria.
Good Faith: Genuine engagement with employees and union representatives.
Consultation: Meaningful consultation prior to retrenchment decisions.
Proportionality: Severance packages reflect tenure and service.
Remedies: Access to CCMA for disputes regarding fairness of process.
Compliance: Adherence to LRA s189 procedure and BCEA severance requirements.
4. Scope
This policy applies to all retrenchments by Jera Consulting, including:
Redundancies due to business closure or relocation.
Position eliminations due to restructuring.
Workforce reductions due to financial constraints.
Technological displacement.
This policy does not apply to dismissals for misconduct or incapacity.
5. Applicable Legislation
Retrenchments governed by:
Labour Relations Act, 66 of 1995 (LRA) - Section 189 (large-scale retrenchments) and Section 189A.
Basic Conditions of Employment Act, 75 of 1997 (BCEA) - Section 41 (severance pay).
Employment Equity Act, 55 of 1998 (EEA) - protection against discriminatory selection.
6. Large-Scale Retrenchment (Section 189A)
Section 189A applies when:
Employer employs 50 or more employees, AND
Employer contemplates retrenching 10 or more employees, OR
Employer contemplates retrenching 10% of the workforce (whichever is lower).
In large-scale retrenchments, enhanced consultation procedures and CCMA facilitation requirements apply.
7. Alternatives to Retrenchment
Before resorting to retrenchment, the employer must consider reasonable alternatives to reduce workforce, including:
Voluntary severance packages (incentivised).
Early retirement packages.
Reduction in working hours.
Temporary leave of absence.
Internal transfers or secondment.
Training and upskilling for alternative positions.
Attrition (non-replacement of resignations).
Redeployment to other divisions or entities.
8. Selection Criteria
Employees selected for retrenchment on objective criteria, typically:
8.1 Last In, First Out (LIFO)
Default selection based on tenure (length of service). Most recent hires retrenched first.
8.2 Alternative Justified Criteria
If LIFO inappropriate, employer may apply alternative criteria if justified:
Performance ratings (objective, documented).
Skills and qualifications (relevance to retained positions).
Operational requirements (business-critical roles).
Restructuring objectives.
Alternative criteria must be objective, transparent, and applied consistently.
8.3 Bumping and Redeployment
Rather than retrenching, employee may be bumped to a lower-level position if qualified and able to perform. Salary protected or managed through agreement.
9. Retrenchment Procedure (Section 189 LRA)
9.1 Notice of Intention
Employer provides written notice of intention to retrench to:
Affected employees.
Union representatives (if union is party to collective agreement).
CCMA (if large-scale retrenchment).
Notice must state:
Reason for retrenchment.
Scope (numbers, categories of employees).
Proposed timeline.
Invitation to consult.
9.2 Consultation Phase
Minimum 30-day consultation period begins from notification.
Consultation topics include:
Reason for retrenchment.
Scope and timeline.
Selection criteria.
Severance packages and details.
Retention of key staff.
Re-employment prospects.
Grievance or dispute resolution mechanisms.
All consultation meetings documented with minutes and attendance recorded.
9.3 Large-Scale Retrenchment - CCMA Facilitation
If Section 189A applies, CCMA facilitator appointed to mediate process.
CCMA notified within 30 days of consultation commencement.
Facilitated meeting(s) held to attempt consensual agreement.
If agreement reached, severance and procedure confirmed.
If no agreement, employer may proceed with retrenchment unilaterally, subject to challenge.
9.4 Selection and Notification
Following consultation, affected employees notified in writing:
Confirmation of retrenchment.
Reason and effective date.
Severance package details.
Final payment arrangements.
Continuation of benefits.
Reference provision.
9.5 Final Payment and Severance
Final payment within 7 days of termination (BCEA s33):
Final salary accrued to date.
Accrued leave (annual and sick).
Severance pay: Minimum 1 week per completed year of service (BCEA s41).
Enhanced severance packages (company policy): 2 weeks per year of service.
All deductions (tax, UIF, etc.) applied.
10. Severance Package Options
Employer offers structured severance packages:
10.1 Statutory Minimum
1 week per completed year of service (BCEA s41).
Example: 5 years service = 5 weeks'' gross salary.
10.2 Company Enhanced Package (Discretionary)
2 weeks per completed year of service (voluntary severance incentive).
Example: 5 years service = 10 weeks'' gross salary.
Plus outplacement services (resume, interview coaching, job search support).
Plus extended medical aid (e.g., 2 months post-termination).
10.3 Voluntary Severance (If Offered Pre-Selection)
2-3 weeks per year service (enhanced to encourage voluntary departures).
May reduce need for involuntary retrenchments.
10.4 Treatment of Leave Encashment
Annual leave accrued: Paid in full at final pay.
Sick leave: Paid per company policy (typically not paid unless policy permits).
11. Protection of Selected Employees
Employees identified for retention confirmed in writing, including:
Confirmation of continued employment.
Position and reporting line.
Salary and benefits.
Expected future changes (if any).
12. Re-Employment Priority
Retrenched employees placed on re-employment priority list:
If suitable positions become available within 12 months, retrenched employee offered position first.
Notification made to retrenched employee of vacant positions.
Preference given regardless of other recruitment processes.
13. Transfer of Contracts (Section 197 LRA)
If retrenchment relates to business transfer, sale, or insolvency:
Contracts of employment may transfer to new employer.
New employer liable for accrued benefits if transfer occurs.
Employee consent not required for contract transfer.
Continuity of service recognised for severance and benefits.
14. Return of Property and Exit Interview
Upon retrenchment, employee required to:
Return all company property (equipment, access cards, keys, etc.).
Participate in exit interview (feedback and documentation).
Sign acknowledgement of final payment and severance.
Confirm post-employment obligations (confidentiality, restraint).
15. Certificate of Service
Employer issues Certificate of Service (BCEA s39) to retrenched employee, including:
Employee name and ID.
Position and tenure.
Reason for termination: ''Retrenchment - operational reasons''.
Date of termination.
Final salary paid.
16. CCMA Disputes
Retrenched employees may challenge fairness of retrenchment at the CCMA within 30 days if they believe:
Reason for retrenchment was unfair.
Procedure was not followed fairly.
Selection criteria applied unfairly or discriminatorily.
Severance package inadequate.
CCMA may award compensation, reinstatement, or enhanced severance.
17. Fairness of Retrenchment
Retrenchment is fair if:
Genuine operational requirements justify the retrenchment.
Reasonable steps taken to avoid or minimise retrenchment.
Fair and transparent selection criteria applied.
Proper consultation conducted.
Fair and reasonable severance offered.
Affected employees treated with dignity and respect.
18. Record Keeping
Employer maintains records of:
Notice to employees and unions.
Consultation minutes and attendance.
Selection criteria and application thereof.
Final payments and severance calculations.
Communications to CCMA (if applicable).
Records retained for 3 years post-retrenchment per POPIA requirements.' where id='HR019';
update hr_policies set icon='📖', summary='This workbook is a practical management guide for identifying, managing, and resolving employee incapacity.', full_text='1. Introduction
This workbook is a practical management guide for identifying, managing, and resolving employee incapacity. Incapacity refers to an employee''s inability to meet the requirements of their position due to poor performance, temporary ill-health, or permanent ill-health. This workbook supports managers in applying performance management and incapacity procedures in accordance with Schedule 8 of the Labour Relations Act (Code of Good Practice: Dismissal).
This workbook is a guide, not a legally binding policy. Managers should consult HR and legal guidance where dismissal may result.
2. Understanding Incapacity
Incapacity has three categories:
2.1 Poor Performance (Work Performance Incapacity)
Employee is capable of performing the job but is not meeting expected standards due to lack of ability, skill, knowledge, competence, or effort.
Examples: Missed deadlines, poor quality work, inability to master required systems, lack of customer service skills.
Remediation: Training, coaching, performance improvement plans, mentoring.
Procedure: Counselling (Step 1), Performance Improvement Plan (PIP), Review Counselling (Step 2), Concluding Counselling (Step 3), Dismissal if no improvement.
2.2 Temporary Ill-Health Incapacity
Employee is temporarily unable to perform due to short-term illness or injury.
Examples: Acute illness, short-term injury, temporary medical condition.
Duration: Days to weeks, expectation of recovery and return to work.
Remediation: Medical support, adjusted duties if possible, rest and recovery.
Procedure: Counselling steps (Step 1-3), monitoring medical certificates, confirmation of fitness to return.
2.3 Permanent Ill-Health Incapacity
Employee permanently unable to perform due to chronic illness, disability, or permanent injury.
Examples: Chronic disease, permanent disability, ongoing mental health condition.
Duration: Long-term or indefinite.
Remediation: Reasonable accommodation, job redesign, redeployment, or termination if no accommodation feasible.
Procedure: Medical assessment, reasonable accommodation exploration, Counselling (Step 1-3), dismissal if no viable alternative.
3. Legal Framework and References
This workbook operates under:
Labour Relations Act, 66 of 1995 - Schedule 8 (Code of Good Practice: Dismissal).
Employment Equity Act, 55 of 1998 - reasonable accommodation for disabilities.
Basic Conditions of Employment Act, 75 of 1997 - wage protection, leave provisions.
Occupational Health and Safety Act, 85 of 1993 - workplace health and safety.
4. Performance Management Framework
Before incapacity procedures are invoked, performance issues must be managed through performance management. This workbook assumes performance management is in place.
4.1 Balanced Scorecard (BSC) Discussion Tips
When reviewing performance against BSC or KPIs, managers should:
Be specific: Reference exact targets and actual performance (e.g., ''90% accuracy target; achieved 75%'').
Be objective: Use metrics, not subjective impressions.
Be fair: Consider context and obstacles (e.g., system downtime, resource constraints).
Be clear: Explain why performance is inadequate and impact on business/team.
Listen: Understand employee perspective and any support needed.
4.2 Performance Improvement Plan (PIP) Preparation
PIP should include:
Clear performance gaps (what is expected vs. actual).
Specific, measurable improvement targets.
Timeline for improvement (typically 3-6 months).
Support provided (training, mentoring, tools, resources).
Consequences of failure to improve.
Regular review meetings (bi-weekly or monthly).
4.3 Good Performance Summary vs. Poor Performance Summary
When documenting performance, distinguish between:
Good performance summary: ''Employee achieved 95% sales target, completed all compliance training, demonstrated excellent customer feedback scores.''
Poor performance summary: ''Employee achieved only 65% of sales target (vs. 90% expected), missed compliance training deadline, received customer complaints regarding responsiveness.''
Poor performance must be objective, specific, measurable, and documented.
5. Incapacity Procedure: Poor Work Performance
Step 1: Initial Counselling
Timing: When performance issue first identified.
Manager meets with employee in private.
Explain performance issue: ''Your accuracy on invoicing is 80%; we require 95%. This affects billing and customer satisfaction.''
Understand employee''s perspective: ''What challenges are you facing? How can we support you?''
Identify support: training, mentoring, revised processes, tools.
Set expectations: ''We expect improvement to 90% within 4 weeks.''
Document conversation: Date, topic, outcome, agreed support.
Inform employee: ''This is a supportive discussion. If performance doesn''t improve, we''ll move to a Performance Improvement Plan.''
Step 2: Performance Improvement Plan (PIP)
Timing: If no improvement after initial counselling (typically 4 weeks).
Formal PIP issued in writing, documenting:
Performance gap and current metrics.
Expected performance standard and timeline.
Support (coaching, training, mentoring) to be provided.
Review meeting dates (bi-weekly or monthly).
Consequences: ''Continued failure may result in dismissal.''
PIP typically 8-12 weeks.
Regular review meetings held; progress tracked against metrics.
Employee given opportunity to explain challenges.
Support adjusted if needed.
Step 3: Review Counselling (Step 2)
Timing: End of PIP period.
Formal meeting with employee and representation (if requested).
Review PIP outcomes: performance against targets achieved?
If improvement sufficient: conclude PIP, return to normal performance management.
If improvement insufficient: document findings, explain that further action (final counselling) will be taken.
Document meeting and outcome.
Step 4: Final Counselling (Step 3)
Timing: If performance remains unsatisfactory after PIP.
Formal counselling session, employee and representation present.
Manager explains: ''Performance has not improved to required standard. We have provided training, mentoring, and PIP. However, you are still not meeting expectations.''
Consider: Is dismissal fair? Are there other reasonable steps?
Offer alternative remedies (job redesign, redeployment, different role) if available.
If no viable alternative: inform employee dismissal may follow.
Provide reasonable notice period to seek alternative employment.
Document all discussion.
Step 5: Dismissal (if applicable)
If performance remains inadequate after all reasonable steps:
Formal dismissal notice in writing, including:
Reason: ''Incapacity due to poor performance despite support provided.''
Effective date and notice period.
Final payment details.
Severance (if applicable).
Right to appeal.
Notice period minimum: 4 weeks (if >1 year service).
6. Incapacity Procedure: Temporary Ill-Health
Step 1: Initial Counselling
When employee unable to perform due to short-term illness:
Manager meets with employee (or contacts if ill).
Inquire about health and expected return date.
Request medical certificate if absence exceeds 2 days.
Inform about benefits continuation, medical aid support.
Document conversation.
Step 2: Medical Review and Support
During absence:
Monitor medical certificates (required for absence >2 days).
Consider adjusted duties upon return if medical restriction noted.
Offer support: EAP services, medical aid benefits, leave options.
Step 3: Return to Work Counselling
When employee returns or when fitness to return questioned:
Confirm employee fitness to return to normal duties.
If restrictions noted on medical certificate, discuss accommodations.
Clarify: ''Can you perform all duties? Are adjustments needed?''
If doubt about fitness, request occupational health assessment.
Document fitness confirmation or required accommodations.
7. Incapacity Procedure: Permanent Ill-Health or Disability
Step 1: Medical Assessment
When employee unable to return after extended leave or diagnosed with chronic condition:
Arrange occupational health or medical assessment.
Assessment focuses on: Job requirements vs. employee capabilities.
Medical professional advises on fitness, restrictions, permanent prognosis.
Obtain consent from employee for medical evaluation (POPIA).
Step 2: Initial Counselling
Following medical assessment:
Manager meets with employee to discuss findings.
Explain medical assessment outcome: ''The assessment indicates you have permanent limitations regarding lifting >5kg. Our role requires lifting up to 20kg.''
Discuss employee''s views and concerns.
Explain reasonable accommodation exploration process.
Document meeting.
Step 3: Reasonable Accommodation Exploration
In accordance with EEA, employer must explore reasonable accommodation:
Role redesign: Remove heavy lifting; reassign to lighter tasks if available.
Job modification: Provide equipment, tools, or technology to reduce physical demands.
Redeployment: Transfer to alternative role matching employee''s capabilities.
Adjusted working arrangements: Part-time work, flexible hours if medically indicated.
Workplace adjustments: Accessible facilities, ergonomic modifications.
Cost considerations: Accommodation should not impose undue burden on employer.
Employee input: Consult employee on proposed accommodations.
Step 4: Decision on Accommodation
Options:
Accommodation approved: Role redesigned or employee redeployed. Return to work.
Partial accommodation: Some role modification, extended transition period.
No viable accommodation: Role cannot be modified; no alternative positions available. Final counselling proceeds.
Step 5: Final Counselling (if no accommodation viable)
If reasonable accommodation not possible:
Manager explains: ''Despite exploring options, we cannot accommodate your medical restrictions within available roles.''
Offer: Extended notice period, outplacement support, medical aid continuation, disability benefits information.
Termination on medical grounds due to inability to perform (fair and justified if process followed).
Final payment and severance (if applicable) provided.
8. Special Considerations
8.1 Mental Health in Incapacity Procedures
When mental health condition affects performance:
Treat with sensitivity and confidentiality.
Arrange EAP support immediately.
Accommodate working arrangements (flexible hours, remote work) if medically indicated.
Avoid stigmatising language or discriminatory action.
Medical assessment may be necessary to clarify fitness and accommodations.
Consider leave options (sick, unpaid, compassionate) in conjunction with treatment.
8.2 Substance Abuse as a Health Condition
Substance abuse is recognised as a health condition:
Treated as incapacity (health), not discipline (misconduct).
Offer EAP support, rehabilitation programs, treatment facilities.
Employee required to participate in treatment as condition of continued employment.
If employee refuses treatment or relapses while under treatment, dismissal may be justified.
Note: Being under influence at work is serious; initial response may be suspension pending assessment.
8.3 Progressive Discipline Within Incapacity
Incapacity procedure is progressive:
Step 1 (counselling): Informal, supportive.
Step 2 (improvement plan): Formal support period.
Step 3 (review counselling): Evaluation of progress.
Step 4 (final counselling): Last opportunity; consequences explained.
Dismissal: Final step if no improvement.
Do not jump steps; follow progression to demonstrate fairness.
8.4 Documentation Requirements
Maintain detailed records:
Dated records of each counselling session.
Performance metrics and improvement targets.
Medical certificates and assessments.
PIP documents and reviews.
Evidence of support provided (training, mentoring attendance).
Employee responses and challenges.
All formal communications and decisions.
Documentation protects both manager and employee; essential if CCMA challenge occurs.
9. Manager''s Incapacity Counselling Checklist
Before conducting counselling, ensure:
Pre-Counselling Checklist
Performance issue clearly identified and documented.
Performance metrics and targets established.
Support required determined.
Previous steps completed (if applicable).
Private, quiet meeting space arranged.
HR notified and advised.
Legal/HR guidance obtained if dismissal potential.
Adequate time allowed for discussion.
During Counselling
Speak clearly and objectively about performance gap.
Use specific examples and metrics.
Listen actively to employee''s perspective.
Avoid emotional language or personal criticism.
Offer practical support and resources.
Be clear on expectations and timeline.
Confirm understanding.
Explain next steps if no improvement.
Post-Counselling
Document meeting (date, time, attendees, topics, outcome).
Provide written summary to employee.
Arrange agreed support (training, mentoring).
Set review date.
File documentation securely.
Inform HR of outcome.
10. Minute Template for Counselling Session
[Date, Time, Location]
Attendees
Manager: [Name/Title]
Employee: [Name/ID]
Representative: [Name/Role, if applicable]
Topic
[Performance Incapacity / Ill-Health / Permanent Incapacity]
Issue Discussed
[Specific performance gap or health issue, with metrics/examples]
Employee''s Response
[Employee''s explanation, concerns, or perspective]
Support/Accommodations Offered
[Training, mentoring, role modification, medical assessment, etc.]
Next Steps
[Specific expectations, timeline, review date]
Manager Notes
[Any additional context or observations]
Signatures
Manager: ___________________________ Date: __________
Employee: ___________________________ Date: __________
Representative: _____________________ Date: __________
11. Key Points for Managers
Early intervention: Address performance issues early before they escalate.
Document everything: Detailed records essential for fairness and CCMA evidence.
Be specific: Use metrics and examples, not vague or subjective language.
Offer genuine support: Incapacity is about helping employees improve, not punishment.
Follow procedure: Do not skip steps; follow the progressive process.
Consult HR: Seek guidance before dismissal decisions.
Listen to employee: Understand their perspective; may reveal underlying issues.
Treat with dignity: Even if dismissal results, treat employee respectfully.
Confidentiality: Do not discuss employee performance publicly.
Be fair and consistent: Similar situations treated similarly.' where id='HR020';
update hr_policies set icon='🛠️', summary='This document is the single source of truth for how Jera Consulting manages all service delivery — from support vouchers to multi-million rand impl…', full_text='1. Purpose & Scope
This document is the single source of truth for how Jera Consulting manages all service delivery — from support vouchers to multi-million rand implementations. It defines thresholds, roles, communication rules, escalation paths, and governance for all four product lines: Sage Intacct, Sage X3, Sage 300 People, and SPA/VIP Payroll.

The framework is designed to run lean. It must work efficiently now and scale without structural change as the team and client base grow. Every rule here exists to reduce friction, protect delivery quality, and give leadership visibility without requiring their constant involvement.

RULE Nothing moves from Sales to Ops without Proof of Payment (POP). No exceptions.

2. Guiding Principles
Async first — written updates, not meetings. Meetings are earned, not defaulted to.
One POP trigger — no delivery work starts without proof of payment.
Damian runs ops — Ryan''s first point of contact is Damian. Always. Damian must know everything.
Chalmain coordinates — she is the single handover point from Sales to Ops and owns the admin flow.
Hypercare is a priority — clients in their first two years post go-live get elevated attention.
Delegate with visibility — consultants own their delivery; managers own their product lines; Damian owns the whole picture.
Escalate exceptions, not routine — if everything is running, nothing should reach Ryan or Raymond.
Build for scale — processes set now must still work at 3x the volume without heroics.

3. Team Structure & Roles
Person
Title
Service Delivery Mandate
JP Schmitt
AME Sales Director
Owns the commercial relationship and proposal. Hands over to Ops on POP. Chalmain has full view of his pipeline, meetings, and proposals.
Chalmain
Sales Secretary (JP)
Deal brief owner. Produces and distributes the deal brief. Schedules the internal brief meeting and the client kickoff. Single handover point from Sales to Ops.
Ryan de Kock
Business Development Director
Full view of all delivery. First escalation point above Damian. Attends all internal deal briefs. Signs off on major decisions.
Damian
Project Manager
Runs all ops-side delivery. Ryan''s first point of contact. Chairs the internal deal brief. Owns project plans, kickoffs, escalations, and resource scheduling across all products.
Neo
Intacct Manager
Leads all Sage Intacct delivery. Attends internal briefs for Intacct deals. Manages Intacct consultants and client relationships.
Kevin
Sage X3 Manager
Leads all Sage X3 delivery. Signs off on all X3 resource allocation. Module-based task distribution across the team.
Melicke
Payroll Manager
Leads delivery for SPA, Sage 300 People, and VIP Payroll. Attends internal briefs for all payroll and HR deals.
Ben Oosthuizen
Finance
Invoicing, budget tracking, financial sign-off.
Raymond de Kock
Managing Director
Weekly RAG Teams message. Strategic oversight. Not in day-to-day delivery.

NOTE Damian is Ryan''s first port of call on any ops question. Damian is expected to have full visibility across all active projects, all vouchers, and all product lines at any given time. If Damian does not know, that is an ops failure.

4. Product & Deal Tier Classification
Every engagement must be classified by product and tier at intake. Tier determines governance, meeting requirements, PM involvement, and reporting obligations. The tables below define the tiers for each product line.

4.1 Sage Intacct

VOUCHER
SMALL PROJECT
MEDIUM PROJECT
LARGE PROJECT
License Value
—
< R165 000
R165 001 – R300 000
> R300 000
Impl. Value
R4k – R50k (hrs)
R100k – R500k
R500k – R1.2M
R1.2M – R2M+
Hours
10 – 50 hrs
100 – 350 hrs
350 – 700 hrs
700 hrs+
Trigger
POP on voucher
Signed SOW + POP
Signed SOW + POP
Signed SOW + POP
PM
Damian (visibility)
Damian
Damian
Damian
Lead
Neo (allocates)
Neo
Neo
Neo
Kickoff
None (hypercare rules apply)
Client kickoff
Client kickoff
Client kickoff
Steering
None
Monthly 30 min
Bi-weekly 30 min
Weekly 30 min
Ryan Attends
CC on weekly RAG
CC on report
Internal brief + RAG
Internal brief + steering

4.2 Sage X3
X3 is always a significant engagement. There is no small X3 project. The team aligns to every X3 implementation and tasks are distributed by module. Kevin signs off on all resource allocation.

VOUCHER / SLA
STANDARD PROJECT
LARGE PROJECT
License Value
Existing client (SLA)
Any size
Any size
Impl. Value
SLA retainer / voucher
R300k – R1M
R1M – R2M+
Hours
10 – 50 hrs (SLA)
300 – 700 hrs
700 hrs+
Resourcing
Kevin allocates per module
Kevin signs off — team aligned
Kevin signs off — full team
PM
Damian
Damian
Damian
Kickoff
None (SLA rules)
Client kickoff
Client kickoff + exec alignment
Steering
Monthly SLA review
Bi-weekly 30 min
Weekly 30 min
Ryan Attends
RAG only
Internal brief + RAG
Internal brief + steering

4.3 SPA, Sage 300 People & VIP Payroll
SPA and VIP Payroll engagements are typically small and fast. Sage 300 People can be considerably larger depending on employee count and module scope. Melicke leads delivery across all three products.

SPA / VIP (SMALL)
300 PEOPLE (MED)
300 PEOPLE (LARGE)
VOUCHER (ALL)
License Value
~R1k/month (10 emp)
< R165k
R165k – R300k+
Existing client
Impl. Value
~R4 000 (~1 day)
R60k – R160k
R160k+
Voucher pack
Hours
4 – 8 hrs
60 – 150 hrs
150 – 350 hrs
10 – 50 hrs
PM
Damian (light touch)
Damian
Damian
Damian (visibility)
Lead
Melicke
Melicke
Melicke
Melicke allocates
Kickoff
None / quick call
Client kickoff
Client kickoff
None (hypercare rules)
Steering
None
Monthly 30 min
Bi-weekly 30 min
None
Ryan Attends
RAG only
CC on report
Internal brief + RAG
CC on weekly RAG

4.4 Support Vouchers — All Products
Voucher packs are available in standard sizes of 10, 20, 30, and 50 hours. Custom amounts within this range are also available. Vouchers are sold through JP and purchased by the client. The Ops trigger is POP — not the signed agreement.

Vouchers are allocated to the relevant product manager (Neo / Kevin / Melicke) who then assigns consultant time.
Damian has full visibility of all active vouchers across all product lines.
Clients in the 2-year hypercare window receive priority scheduling — see Section 8.
Voucher balances are tracked in Odoo. Chalmain monitors usage and flags low balances for renewal conversations.

5. Sales to Ops Handover — The POP Rule
The handover from Sales to Ops is triggered exclusively by Proof of Payment. The moment POP is confirmed, Chalmain initiates the flow below. This is non-negotiable — no resources are allocated and no delivery begins before this trigger.

#
Step
Detail
1
Deal Won — Sales
JP closes the deal. Proposal signed or verbal commitment confirmed.
2
Proof of Payment (POP) Received
POP is the trigger. Nothing moves to Ops without it. Chalmain confirms POP is in hand.
3
Chalmain Produces the Deal Brief
Short, factual, no fluff. See Section 6 for mandatory content.
4
Internal Deal Brief Meeting Scheduled
Chalmain sends meeting request with deal brief + proposal attached. Standard attendees: Ryan + Damian + relevant product manager. Consultant included if they were part of the sales process.
5
Internal Deal Brief Meeting
Damian chairs. Max 30 minutes. Output: resource allocated, kickoff date targeted, open questions resolved.
6
Chalmain Schedules Client Kickoff
Running parallel to Steps 3–5. Chalmain works the client''s calendar so kickoff is ready to go immediately after the internal brief.
7
Client Kickoff
Damian leads. Presents the project plan and kickoff document. Sets the tone and expectations.
8
Project Delivery Begins
Consultant(s) execute. Damian maintains visibility. Chalmain monitors admin and milestones.

NOTE Chalmain schedules the client kickoff in parallel — she does not wait for the internal brief to complete before approaching the client''s diary. The goal is to have a kickoff date ready to confirm at the end of the internal brief meeting.

6. The Deal Brief
The deal brief is a short, factual document produced by Chalmain from JP''s proposal, meeting notes, and her knowledge of the deal. It is not a summary of the proposal — it is the intelligence the ops team needs to deliver. It must be concise. One page is the target.

Field
What to Include
Client & Product
Client name, product(s) being implemented, deal reference
Deal Value
License fee (ARR or once-off), implementation fee, total contract value
In Scope
Exactly what has been sold and committed to in the proposal
Out of Scope
Explicitly what is NOT included — prevents scope creep from day one
T&Cs — Make or Break
Any contractual clause, payment term, SLA, or condition that could affect delivery — flag it here
Client Vibe
Personality of the key stakeholder(s), decision-making style, any known sensitivities or concerns. Be honest.
Consultant Involved in Sales?
Yes / No — and if yes, who and what was discussed
Proposed Go-Live Date
Target date from the proposal or client expectation
Open Questions / Risks
Anything unresolved at handover that Ops needs to be aware of

RULE The deal brief must be attached to the internal meeting request before the meeting. Attendees are expected to have read it. The internal brief meeting is not a reading session.

7. Meeting Framework
Meetings are the last resort, not the default. Every meeting below has a defined purpose, time limit, and mandatory output. No standing project meetings are permitted unless explicitly approved by Ryan.

Meeting
Who Attends
When
Max Duration
Output
Internal Deal Brief
Ryan + Damian + relevant product manager (+ consultant if in sales)
Within 48hrs of POP
30 min
Resource allocated, kickoff date targeted
Client Kickoff
Damian + lead consultant + client stakeholders
Within 1 week of internal brief
60–90 min
Project plan signed off, expectations set
Tier 3 Steering
Damian + client + product manager
Monthly
30 min
Status confirmed, risks reviewed
Tier 4 Steering
Damian + Ryan + client + product manager
Bi-weekly
30 min
Status, budget, timeline review
X3 Steering
Damian + Kevin + client
Bi-weekly
30 min
Module progress, resource check
Escalation Call
Triggered parties only — see Section 9
As triggered
30 min max
Decision made, action logged
Raymond RAG Update
Automated Teams message — not a meeting
Weekly (Monday AM)
N/A
Red flags visible, no meeting needed

7.1 Internal Deal Brief Meeting — Rules
Ryan and Damian are always present.
Only the relevant product manager attends — not all three.
Consultant attends only if they were involved in the sales process.
Damian chairs. Maximum 30 minutes.
The deal brief and proposal must be read by attendees before the meeting.
Output: resource named, kickoff date targeted, open questions documented.

7.2 Internal Meeting Cadence — Scale Trigger
Currently, internal deal brief meetings are scheduled per deal as required. As deal volume increases, the following model applies:

Below 6 project starts per month: schedule individual briefs per deal, within 48 hours of POP.
At 6 or more project starts per month: introduce a fixed weekly slot (e.g. Tuesday 9:00 AM) where all deals with POP that week are briefed in a single 45-minute session. This is standard practice at scale — one batch session prevents calendar fragmentation.
Damian and Ryan review the cadence model at the 6-project-per-month threshold and agree the transition.

8. Hypercare — The Two-Year Client Priority Framework
Every client is in hypercare for the first two years after their go-live date. During this period they receive elevated support priority, faster response SLAs, and closer monitoring. This is a Jera standard — not a premium option. Clients are experiencing our processes and our value during this window. We protect that.

Period
Support Priority
Voucher Response SLA
Who Monitors
0 – 3 months post go-live
CRITICAL — highest priority
Same business day
Damian + product manager
3 – 12 months post go-live
HIGH
Next business day
Product manager
12 – 24 months post go-live
ELEVATED
Within 2 business days
Product manager
24 months+
STANDARD
Standard SLA applies
Chalmain monitors

Chalmain tracks all client go-live dates in Odoo. Hypercare status is visible on the service dashboard.
When a hypercare client logs a voucher request, it is flagged automatically and prioritised above standard queue.
At the 24-month mark, Damian and the relevant product manager review the client relationship and flag any renewal or upsell opportunities to JP.

9. Escalation Framework
Escalation is the system working correctly. Surface problems early. The table below defines every trigger, threshold, escalation path, and response SLA.

Trigger
Threshold
Escalate To
SLA
Method
Budget overrun
> 10% of agreed value
Damian → Ryan
24 hrs
Email
Timeline slip
> 2 weeks behind plan
Damian flags to Ryan
24 hrs
Email
Major timeline slip
> 4 weeks
Damian + Ryan → client
24 hrs
Call
Client complaint / red flag
Any formal complaint
Chalmain → Ryan immediately
Same day
Call
Consultant unavailable
> 2 days mid-project
Damian → Kevin/Neo/Melicke
Same day
Teams/call
Scope change requested
Any change to agreed scope
Chalmain issues CRF → Damian signs off
48 hrs
Email + CRF doc
Unpaid invoice blocking delivery
> 30 days overdue
Chalmain → Ben + Ryan
24 hrs
Email
Hypercare SLA breached
Response outside SLA window
Damian notified immediately
Same day
Teams
X3 resource conflict
Module resourcing issue
Damian → Kevin
24 hrs
Teams or call

9.1 Escalation Protocol
Chalmain or Damian identifies that a trigger threshold has been breached.
Written escalation sent to the relevant person(s) via email or Teams — clearly flagged.
If no response within SLA, follow up via Teams or WhatsApp.
If still no response, call directly.
Resolution confirmed in writing. Chalmain logs the escalation, response, and outcome in Odoo.

10. RACI — Roles & Accountability
R = Responsible (does it) | A = Accountable (owns the outcome) | C = Consulted | I = Informed

Activity
Chalmain
Damian
Neo (IC)
Kevin (X3)
Melicke (Pay)
Ryan
Raymond
Deal brief production
R
I
—
—
—
I
—
Internal brief scheduling
R
A
C
C
C
I
—
Internal brief (chair)
A
R
C
C
C
I
—
Client kickoff scheduling
R
A
—
—
—
—
—
Client kickoff (lead)
C
R
C
C
C
I
—
Project plan production
—
R
C
C
C
I
—
Resource allocation (IC/Pay)
—
R
A
—
A
I
—
Resource allocation (X3)
—
C
—
R/A
—
I
—
Status reporting
C
R
C
C
C
I
I
Budget tracking
R
A
—
—
—
I
I
Escalation triage
R
A
C
C
C
I
—
Invoice triggering
R
C
—
—
—
—
C
Scope change (CRF)
R
A
C
C
C
I
—
Hypercare monitoring
R
A
C
C
C
I
—
CoB process (pre-transfer)
R
I
—
—
—
I
—
Weekly RAG report
R
A
C
C
C
I
I
Project closure
R
R
C
C
C
I
—

11. Change of Business Partner (CoB) Process
A CoB engagement moves through Sales until the VAR-to-VAR transfer is complete. Jera has no system access until that transfer is confirmed by Sage. The process is tracked by Chalmain and handed to Ops at the point of transfer completion.

#
Stage
Detail / Rules
1
Deal agreed in Sales
JP and client agree to partner transfer. Chalmain tracks in pipeline.
2
VAR-to-VAR Transfer initiated
Sage initiates the transfer between outgoing and incoming partner. Jera has NO system access until complete.
3
Sales may request consultant support
Consultants may assist with pre-transfer questions or scoping. This is informal — no project opened, no ticket. Damian is aware.
4
VAR-to-VAR Transfer confirmed
Jera receives confirmation. System access granted. This is the trigger to open a formal project or support record.
5
POP received (if applicable)
If implementation or support is part of the deal, POP triggers the standard Sales-to-Ops flow from Section 5.
6
Standard flow applies
Deal brief, internal brief, kickoff — all as per normal process.

RULE No formal project is opened and no delivery work begins until the VAR-to-VAR transfer is confirmed. Consultants may provide informal pre-transfer support at the request of Sales, but this is tracked and Damian is aware.

12. Audit-Led Engagement Process
Some client engagements begin with an audit — either a free discovery exercise or a fixed-price engagement — before a full implementation SOW is scoped. The audit is a Sales and Ops collaboration; the resulting project follows the standard flow.

#
Stage
Detail / Rules
1
Audit engagement agreed
Audit is either free or fixed price — agreed at proposal stage. Chalmain tracks.
2
POP received (if fixed price)
Fixed-price audits require POP before work starts. Free audits proceed on written agreement.
3
Audit delivered
Consultant(s) execute the audit. Damian has visibility. No formal project governance required unless > 50 hours.
4
Audit output produced
Findings document delivered to client. This becomes the foundation of the SOW.
5
Joint SOW — Sales + Ops
Ryan + relevant product manager work with JP to scope the hours and produce the SOW. Chalmain coordinates the document flow.
6
Proposal presented by Sales
JP presents the proposal to the client. Standard commercial process.
7
POP received — standard flow
On POP, the deal follows the standard Sales-to-Ops flow from Section 5.

13. Client Kickoff Document — Mandatory Content
Damian presents a single kickoff document at every client kickoff. The project plan is a separate attachment. The kickoff document must contain the following as a minimum — no ambiguity, no gaps.

Section
What Must Be Included
Project Overview
Client name, product, project code, go-live target date, project manager, lead consultant
Confirmed Scope
What is being implemented — modules, entities, integrations, data migrations. Signed off on the day.
Explicitly Out of Scope
What is NOT included. Non-negotiable to have this in writing at kickoff.
Project Plan Summary
High-level milestones, phases, and target dates. Full plan shared as a separate document.
Resource Allocation
Who from Jera is doing what. Who from the client is the project owner and key contact.
Communication Plan
How and when Jera and the client communicate. Channels, cadence, escalation contacts.
Key T&Cs
Payment terms, change control process, sign-off requirements. No ambiguity.
Client Responsibilities
What the client must do and when — data, access, UAT, sign-offs. Delays here affect go-live.
Risk Register (initial)
Any known risks at kickoff — data quality, resource availability, integration dependencies.
Sign-Off Block
Client project owner signs the kickoff document on the day. This is not optional.

RULE The client project owner signs the kickoff document at the kickoff meeting. A kickoff that ends without a signature is not complete. Chalmain follows up within 24 hours if the signature is not obtained on the day.

14. Raymond''s Weekly RAG Report
Raymond receives a weekly Teams message every Monday morning. This is not a meeting. It is a structured status summary that gives him full visibility across all delivery and all teams without requiring his time or attendance anywhere.

14.1 RAG Status Definitions
GREEN — On track. No action required.
AMBER — At risk. Being managed. Raymond is aware but no action required from him yet.
RED — Escalation active or imminent. Raymond may be asked to act.

14.2 Weekly RAG Message Structure
The message follows this structure every week:

Active Projects by Product — RAG status per project (name, tier, status, one-line note if AMBER or RED)
Active Vouchers — count per product line, any hypercare flags
New Projects Started This Week — name, product, tier
Projects Closed This Week — name, product
Open Escalations — count, highest severity
Invoices Triggered This Week — total value
Any item requiring Raymond''s input or awareness — clearly flagged at the top

Chalmain produces the RAG message from the Odoo dashboard. Damian reviews and approves before it is sent. Ryan is copied.

15. Document Control
This framework is reviewed every six months or when team size, product set, or delivery volume changes materially. Damian and Ryan lead the review. Raymond approves any structural changes.

Version
Date
Author
Changes
1.0
April 2026
Ryan de Kock
Initial draft
2.0
April 2026
Ryan de Kock
Product tiers, deal flow, hypercare, CoB, audit-led, full team structure' where id='HR021';
update hr_policies set icon='🗂️', summary='Jera Consulting (Pty) Ltd (“the Company”) relies on accurate, accessible, and secure documentation to deliver quality services to our clients and m…', full_text='1. Introduction
Jera Consulting (Pty) Ltd (“the Company”) relies on accurate, accessible, and secure documentation to deliver quality services to our clients and meet our regulatory obligations. This Document Management Policy establishes mandatory standards for how all company documents are created, stored, shared, and retained across the Microsoft 365 environment — specifically SharePoint, OneDrive for Business, and Microsoft Teams.
The purpose of this policy is to ensure that company information remains a shared organisational asset rather than isolated on individual devices, to protect business continuity, and to support compliance with the Protection of Personal Information Act 4 of 2013 (“POPIA”), the Companies Act 71 of 2008, and applicable professional standards.
2. Scope
This policy applies to all employees, contractors, temporary staff, and any other individuals who create, access, or handle company documents and data on behalf of Jera Consulting. It covers all document types, including but not limited to:
Client proposals, statements of work, project charters, and deliverables
Internal policies, procedures, and guidelines
Financial records, invoices, purchase orders, and supporting documentation
Human resources documentation, employment contracts, and personnel files
Technical documentation, design documents, and code repositories
Correspondence, meeting minutes, and project communications
Marketing materials, presentations, and training content
3. Definitions
Term
Definition
SharePoint
Microsoft SharePoint Online — the Company’s primary document management and collaboration platform, accessible via the web and integrated into Microsoft Teams.
OneDrive for Business
A personal cloud storage area within Microsoft 365, linked to each employee’s account. Intended for work-in-progress files that will be moved to SharePoint once finalised.
Microsoft Teams
The Company’s collaboration hub. Each Team channel has an associated SharePoint document library where files shared in that channel are stored.
Local Storage
Any storage on a personal device, including the C: drive, Desktop, Downloads folder, USB drives, external hard drives, or any non-cloud location.
Document Owner
The individual responsible for the accuracy, currency, and proper storage of a specific document or set of documents.
Sensitive Information
Any data classified as personal information under POPIA, confidential client data, financial records, or information subject to legal privilege or contractual non-disclosure obligations.
4. Policy Principles
4.1 Cloud-First Storage
All company documents must be stored in the Company’s Microsoft 365 cloud environment. SharePoint is the default and primary repository for all finalised, shared, and project-related documentation. OneDrive for Business may be used as a temporary workspace for drafts and personal work-in-progress items, provided these are moved to the appropriate SharePoint site or Teams channel once complete or when collaboration is required.
4.2 No Local-Only Storage
Employees must not store the sole copy of any company document on a local device, including desktops, laptops, tablets, smartphones, USB drives, or external hard drives. Local copies may exist temporarily for offline work, but the primary version must always reside in SharePoint, OneDrive for Business, or a Teams channel.
Failure to comply with this requirement places the Company at risk of data loss, version conflicts, audit failure, and potential POPIA breaches where personal information is stored on unmanaged devices.
4.3 Single Source of Truth
Each document must have one authoritative version stored in a defined SharePoint location. Employees must not maintain separate copies on email, local drives, or alternative cloud services (e.g. personal Google Drive, Dropbox, or WeTransfer). Where collaboration on a document is required, Microsoft 365 co-authoring should be used to ensure all changes are captured in a single version.
4.4 Logical Folder Structures
SharePoint sites and document libraries must be organised using a consistent, logical folder hierarchy. As a minimum standard, project-related documentation should follow a structure that separates deliverables by phase or category (e.g. Planning, Design, Implementation, Go-Live, Support). Department-level libraries should similarly group documents by function (e.g. Policies, Templates, Reports).
The IT department, in consultation with department heads, is responsible for establishing and maintaining standard folder structures and naming conventions across SharePoint.
4.5 Naming Conventions
All documents must follow the Company’s standard naming convention to support searchability and version identification. The recommended format is:
[Company/Client Code] – [Document Type] – [Description] – [Version or Date]
For example: “JERA POL- Document Management Policy - 2026.docx” or “CLIENT-ABC – SOW – Phase 2 Implementation – v1.2.docx”. The use of vague filenames such as “Final version (2).docx” or “Copy of report.xlsx” is not permitted.
5. Acceptable Use of Microsoft 365 Storage
5.1 SharePoint
Store all finalised client deliverables, project documentation, and shared team resources.
Use SharePoint document libraries (not lists) for file storage.
Apply appropriate permissions to restrict access to sensitive documents.
Use version history (enabled by default) — do not save separate copies with “v2”, “v3” in the filename.
Do not create unnecessary SharePoint sites without IT approval.
5.2 OneDrive for Business
Use for personal drafts, work-in-progress, and files not yet ready for team access.
Transfer finalised documents to the relevant SharePoint site or Teams channel promptly.
Do not use OneDrive as a long-term archive or as a substitute for SharePoint.
Ensure that any files containing sensitive or personal information are moved to the appropriate secured SharePoint library as soon as practicable.
5.3 Microsoft Teams
Files shared in Teams channels are automatically stored in the channel’s SharePoint document library — this is the preferred method for project collaboration.
Use the Files tab within channels rather than sharing documents as email attachments.
Avoid uploading files directly into Teams chat messages where possible, as these are stored in the sender’s OneDrive and are harder to manage centrally.
6. Prohibited Practices
The following practices are prohibited under this policy:
Storing the only copy of a company document on a local device, USB drive, or external hard drive.
Saving company documents to personal cloud storage services (Google Drive, iCloud, Dropbox, or similar) unless explicitly authorised in writing by the IT department.
Emailing documents to personal email addresses for the purpose of storage or convenience.
Sharing documents with external parties via methods that bypass the Company’s approved sharing settings (e.g. creating anonymous sharing links without approval).
Disabling or circumventing SharePoint version control, check-in/check-out, or other document management features.
Creating duplicate SharePoint sites, Teams, or channels without prior authorisation from the IT department.
Ignoring or overriding standard folder structures or naming conventions without departmental approval.
7. Security and Access Control
Document security is a shared responsibility. The following controls apply:
Access to SharePoint sites and document libraries must be granted on a need-to-know basis, using Microsoft 365 security groups where possible.
Sensitive documents (as defined in Section 3) must be stored in SharePoint libraries with restricted permissions and, where appropriate, protected with Microsoft sensitivity labels.
External sharing must comply with the Company’s data sharing policy. Where documents must be shared with clients or third parties, the document owner must use the Company’s approved external sharing mechanism and ensure that access is time-limited and revoked when no longer required.
Employees must not share login credentials or grant others access to their OneDrive for Business.
Documents containing personal information as defined by POPIA must be handled in accordance with the Company’s POPIA compliance programme and the conditions for lawful processing set out in the Act.
8. Document Retention and Disposal
The Company’s document retention schedule (maintained separately) prescribes the minimum retention periods for each category of business documentation. As a general guide:
Financial records: 5 years from the end of the financial year to which they relate (Companies Act, s. 24; Tax Administration Act, s. 29).
Employment records: 3 years after termination of employment (BCEA, s. 31).
Client project documentation: for the duration of the project plus 5 years, or as contractually required.
POPIA-related records: for the duration necessary to fulfil the purpose for which the information was collected, plus any legally mandated retention period.
Documents must not be deleted, destroyed, or removed from SharePoint before the applicable retention period has expired, unless authorised by the relevant department head and the IT department. When documents reach the end of their retention period, disposal must follow the Company’s approved disposal procedure, which includes secure deletion and, where applicable, a record of destruction.
9. Backup and Business Continuity
Documents stored in SharePoint and OneDrive for Business benefit from Microsoft 365’s built-in redundancy, version history, and recycle bin protections. The Company additionally maintains a backup solution for Microsoft 365 data to guard against accidental deletion, ransomware, and data corruption.
Documents stored solely on local devices are not covered by the Company’s backup infrastructure. This is a primary reason for the cloud-first mandate — if a device is lost, stolen, damaged, or compromised, any locally stored documents that do not exist in the cloud environment will be irrecoverably lost.
10. Roles and Responsibilities
Role
Responsibility
All Employees
Comply with this policy. Store all documents in SharePoint, OneDrive, or Teams. Follow naming conventions and folder structures. Report any data loss or suspected breach promptly.
Department Heads / Managers
Ensure team compliance. Review and maintain departmental SharePoint sites and folder structures. Approve access requests for sensitive libraries. Conduct periodic reviews of document storage practices within their teams.
IT Department
Administer the Microsoft 365 environment. Establish and enforce SharePoint site structures, permissions, and external sharing policies. Provide training and support. Monitor storage usage and flag non-compliance. Maintain the backup solution.
Document Owners
Ensure assigned documents are current, properly stored, and accessible to authorised personnel. Manage permissions for documents under their ownership. Archive or dispose of documents in accordance with retention schedules.
Managing Director
Approve this policy and any material amendments. Ensure adequate resources are allocated for Microsoft 365 administration and user training.
11. Training and Awareness
All employees will receive training on this policy and on the practical use of SharePoint, OneDrive for Business, and Microsoft Teams for document management. Training will be provided as part of the onboarding process for new employees and refreshed annually or whenever material changes are made to the policy or the Microsoft 365 environment.
The IT department will maintain quick-reference guides and will make itself available for ad hoc support requests related to document storage and retrieval.
12. Monitoring and Compliance
The IT department will periodically audit document storage practices, including reviewing OneDrive usage patterns, SharePoint site permissions, and external sharing activity. Where significant volumes of documents are found to be stored locally or outside the approved environment, the relevant department head will be notified and a remediation plan agreed.
Employees may be asked to confirm, as part of periodic compliance checks, that they are not maintaining local-only copies of company documentation.
13. Non-Compliance and Disciplinary Action
Compliance with this policy is mandatory. Failure to adhere to the requirements set out in this document may result in disciplinary action in accordance with the Company’s Disciplinary Code and Procedure (HR 016), which may include:
A verbal warning for a first offence where the impact is limited and remediation is straightforward.
A written warning for repeated non-compliance or where the failure creates a material risk to data integrity, client confidentiality, or business continuity.
A final written warning or further action for persistent non-compliance, wilful disregard of the policy, or where the failure results in data loss, a POPIA breach, or reputational harm to the Company.
Where non-compliance constitutes a breach of POPIA or other legislation, the Company reserves the right to report the matter to the relevant regulatory authority and to pursue any legal remedies available to it.
14. Review and Amendment
This policy will be reviewed annually, or sooner if required by changes in legislation, the Company’s technology environment, or business needs. The Managing Director must approve all amendments. The current version will be published on the Company’s SharePoint intranet and communicated to all employees.' where id='HR022';
update hr_policies set icon='⏱️', summary='This policy establishes the mandatory requirements for recording billable and non-billable working time by all Jera Consulting consultants.', full_text='1. Purpose
This policy establishes the mandatory requirements for recording billable and non-billable working time by all Jera Consulting consultants. Accurate, timely time recorded data is essential to:
• Invoicing clients correctly and maintaining commercial trust.
• Giving the Project Manager the data needed to report on project performance, budgets, and resource allocation to management every Monday.
• Supporting payroll accuracy, leave reconciliation, and contractual compliance.
• Enabling data-driven decisions on capacity planning and project forecasting.
2. Scope
This policy applies to every individual who performs work for or on behalf of Jera Consulting, including but not limited to:
• Permanent employees (full-time and part-time).
• Fixed-term contractors.
• Independent contractors and sub-contractors working under Jera engagements.
The policy covers all categories of time: client-billable project work, internal project work, administrative tasks, training, travel, and leave.
3. Time Logging Requirements
3.1 System of Record
All time must be logged in the company’s designated project management system. The system of record may change from time to time. The current platform in use will be communicated by management and referenced in onboarding materials.
3.2 What Must Be Logged
• All billable hours against the correct project, task, and activity code.
• All non-billable hours (internal meetings, training, admin, travel).
• Leave (annual, sick, family responsibility, study) — even if also recorded in a separate leave system.
• A clear, concise description of the work performed for each time entry.
3.3 Logging Frequency
Time should be logged daily, as close to real-time as practical. At a minimum, all time for a given week must be captured and finalised in the system by Friday afternoon at 17:00 of that same week. The minimum timeslots for logging time is 5 minutes per task worked on.
3.4 The 48-Hour Grace Period
Consultants have a 48-hour grace period from the time work is performed to log or correct their entries during the normal working week. This grace period exists to allow for reasonable flexibility, especially if the consultants are required to work over the weekend.

However, regardless of the 48-hour grace period, all time entries for the week must be complete and accurate by Sunday evening at 17:00. This hard cutoff ensures the Project Manager has clean data to prepare for the Monday Operations management review meeting.
3.5 Accuracy and Honesty
• Time entries must reflect the actual hours worked. Rounding must be reasonable and consistent (e.g., to the nearest 5 minutes).
• Consultants must not log time to a project or task they did not work on.
• Guessing, estimating after the fact, or copying previous entries without verification is not acceptable.
• If you are unsure which project code or task to log against, ask your line manager or the Project Manager before the Friday cutoff — do not leave entries unlogged.
4. Roles and Responsibilities
4.1 All Consultants and Staff
• Log time daily in accordance with sections 3.2–3.5 above.
• Ensure all weekly time is finalised by Friday afternoon.
• Respond promptly to any queries from line managers or the Project Manager about time entries.
• Flag system issues, project code errors, or access problems immediately — these are not valid excuses for late logging.
4.2 Line Managers
• Review and approve direct reports’ time entries weekly before Friday afternoon.
• Conduct 1-on-1 discussions with any team member who fails to log on time.
• Escalate repeat offenders to the Project Manager for formal action.
4.3 Project Manager
• Owns the weekly time-data review and prepares the Monday management report.
• Maintains oversight of project-level time accuracy and raises discrepancies with the relevant line manager.
4.4 Human Resources / Office Manager
• Processes any recoveries of quantifiable losses as directed under section 6.4, following the procedure required by section 34(2) of the BCEA.
• Maintains distribution records confirming this policy was issued to each employee/contractor.

5. The Friday Afternoon Cutoff
Every Monday, the Project Manager presents a project performance and budget update to the operations management team (the Operations Director and product-line managers). The Managing Director receives an equivalent written RAG summary as set out in the Service Delivery Framework (HR 021, §14). This report is only as good as the underlying time data. For this reason:
• All time entries for the current week must be finalised in the system by close of business on Friday (17:00).
• Any time entry submitted after the Friday cutoff is considered late and will trigger the compliance and disciplinary framework, regardless of whether it falls within the 48-hour grace period for that specific entry.
• "Finalised" means the entry is complete, accurately described, and allocated to the correct project and task — not merely a placeholder or draft.
The Friday cutoff is non-negotiable. If you anticipate being unable to meet the cutoff (e.g., due to illness, travel, or an emergency), you must notify your line manager and the Project Manager before 17:00 on Friday. Pre-arranged extensions may be granted at the Project Manager’s sole discretion.
6. Compliance and Disciplinary Framework
Jera Consulting takes time logging compliance seriously because it directly affects client billing, project profitability, and management decision-making. The framework below applies a progressive, fair-process approach consistent with Schedule 8 of the Labour Relations Act and section 34 of the Basic Conditions of Employment Act. No monetary fines are levied for late or inaccurate logging; where a breach causes an actual, quantifiable financial loss to Jera, that loss may be recovered only as set out in section 6.4.
6.1 How the Framework Works
• Employees and independent contractors are addressed under separate tier tables because the underlying relationships with Jera differ, and the remedies available in each relationship differ.
• Disciplinary sanctions for employees (warnings placed on file, suspension without pay, dismissal) are only imposed after a fair disciplinary hearing in terms of section 6.5. No sanction beyond a verbal warning is imposed automatically.
• Recovery of financial losses from an individual is limited to the actual quantified loss, and follows the procedure in section 6.4.
• The 3-month rolling window for repeat offences resets after 3 consecutive months of full compliance. Tier 4 outcomes do not reset.
6.2 Progressive Discipline — Employees
Tier
Trigger
Disciplinary Action
Tier 1
1st late or inaccurate time log in a rolling 3-month period
Verbal warning issued by line manager;
Tier 2
2nd offence within the same rolling 3-month period, OR any billing error directly caused by missing or inaccurate time data
Formal written notice placed on personnel file following a disciplinary hearing; weekly time-log oversight imposed for 60 calendar days.
Tier 3
3rd offence within the same rolling 3-month period, OR more than 5 cumulative lapses within any 6-month window
Final written warning following a disciplinary hearing; suspension without pay of up to 2 working days may be imposed as part of the sanction, subject to the outcome of the hearing; removal from client-facing engagements pending review.
Tier 4
Any offence following a Tier 3 sanction, OR deliberate falsification of time logs at any time (regardless of prior disciplinary history)
Dismissal following a fair disciplinary hearing under Schedule 8 of the Labour Relations Act. Legal review initiated where falsification is involved.
6.3 Progressive Discipline — Contractors
The tiers below apply to independent contractors and sub-contractors engaged by Jera Consulting. All actions are taken under the contractor''s engagement agreement, not under any employment disciplinary authority. Nothing in this policy creates or implies an employment relationship with a true independent contractor.
Tier
Trigger
Contractual Action
Tier 1
1st late or inaccurate time log in a rolling 3-month period
Formal written notice from the Project Manager under the engagement contract; remediation plan and expectation setting.
Tier 2
2nd offence within the same rolling 3-month period, OR any billing error directly caused by missing or inaccurate time data
Written notice of contractual breach; weekly time-log oversight imposed for 60 calendar days; recovery of any quantified losses under section 6.4.
Tier 3
3rd offence within the same rolling 3-month period, OR more than 5 cumulative lapses within any 6-month window
Final written notice of breach; suspension of further engagements pending review; recovery of any quantified losses under section 6.4.
Tier 4
Any offence following a Tier 3 notice, OR deliberate falsification of time logs at any time (regardless of prior history)
Termination of the engagement under the contractor agreement, effective in accordance with the contract''s notice provisions; recovery of any overbilled amounts under section 6.4; legal review where falsification is involved.
6.4 Recovery of Quantifiable Losses
Where late or inaccurate time logging causes Jera Consulting an actual, quantifiable financial loss — for example a client billing error that Jera must refund or credit — Jera may recover that loss from the responsible individual only on the following basis:
• For employees, recovery is effected strictly in accordance with section 34(2) of the Basic Conditions of Employment Act: the loss must have occurred through the employee''s fault in the course of employment, a fair procedure must be followed giving the employee a reasonable opportunity to be heard, the amount recovered may not exceed the actual quantified loss, and total deductions may not exceed one-quarter of the employee''s monthly remuneration in money.
• The specific written consent required by section 34(1)(a) of the BCEA is recorded in the individual employment contract. This policy does not itself constitute that consent, and continued employment after receipt of this policy does not create it.
• For contractors, recovery of quantifiable losses is effected under the contractor''s engagement agreement, typically by offset against the next invoice payment, subject to any notice and dispute rights set out in the contract.
6.5 Disciplinary Hearings and Fair Procedure
Before any sanction beyond a verbal warning is imposed on an employee — including a formal notice on file, suspension without pay, a final written warning, or dismissal — the employee is entitled to the following:
• Written notice of the allegation and the proposed sanction, issued at least 48 hours before the hearing.
• Reasonable time to prepare a response and gather supporting evidence.
• The right to be represented at the hearing by a fellow employee or, where applicable, a trade union representative.
• An opportunity to respond to the allegation, present evidence, and question any witnesses called against them.
• A written outcome with reasons, and an internal right of appeal to the Managing Director within 5 business days of the outcome.
For contractors, equivalent fair-process rights are set out in the engagement agreement and will be followed in good faith before any Tier 3 or Tier 4 action is taken.
6.6 Disputes
• An affected individual has 5 business days from the date they are notified of a sanction or recovery decision to raise a factual dispute in writing to the Project Manager.
• The dispute must clearly state which facts are contested and provide supporting evidence (e.g., screenshots of system outages, proof of prior manager approval for an extension).
• The Managing Director will review the dispute and issue a final, binding internal decision within 10 business days. This internal process does not limit any external remedy available to the individual under South African labour law.
6.7 Rolling Period Reset
The 3-month rolling period resets after 3 consecutive months of full compliance (no offences). An individual who reaches Tier 2 but then logs correctly for 3 full months returns to a clean slate. Tier 4 (dismissal, termination of engagement, or a falsification finding) does not reset.
7. Falsification of Time Logs
Deliberate falsification of time logs is treated as gross misconduct and constitutes grounds for dismissal following a fair disciplinary hearing under section 6.5, irrespective of the offender''s prior disciplinary record. Falsification includes, but is not limited to:
• Logging hours to a project the individual did not work on.
• Inflating hours worked to meet utilisation targets or increase billable revenue.
• Logging time on behalf of another person without authorisation.
• Backdating or altering entries to avoid a penalty under this policy.
Where falsification results in a client being overbilled, Jera Consulting will recover the overbilled amount from the individual’s final pay and will notify the affected client as part of its commitment to transparency.
8. System Downtime and Technical Issues
If the designated project management system is unavailable due to scheduled maintenance or an unplanned outage:
• Consultants must record their time offline (e.g., in a spreadsheet or notebook) and enter it into the system as soon as access is restored.
• System downtime does not automatically extend the Friday cutoff. If an outage occurs close to the cutoff, notify the Project Manager immediately so alternative arrangements can be made.
• IT issues affecting a single user (e.g., password lockout, browser incompatibility) must be reported to IT support immediately and are not valid grounds for late logging.
9. Amendments
This policy may be amended from time to time at the discretion of the Managing Director. All amendments will be communicated in writing and will take effect 14 calendar days after notification. Continued employment or engagement after the effective date constitutes acceptance of the amended terms.
10. Distribution and Acknowledgement
This policy will be distributed to all personnel via email or the company’s internal communication channels. Receipt of this policy via email or any other official channel constitutes notice. It is the responsibility of each individual to read, understand, and comply with this policy upon receipt.
No separate signed acknowledgement form is required. By continuing to perform work for or on behalf of Jera Consulting after receiving this policy, you confirm that you have read and understood its contents and agree to be bound by its terms, including the compliance and disciplinary framework set out in section 6.
If you have any questions about this policy or require clarification on any of its provisions, you must raise them with your line manager or the Project Manager within 5 business days of receiving the policy.
11. Version History
Version
Date
Author
Description
1.0
January 2026
Jera Consulting
Initial release
1.1
April 2026
Jera Consulting
Updated grace period to 48 hours; introduced Friday afternoon cutoff.
1.2
April 2026
Jera Consulting
Revised compliance and disciplinary framework for alignment with BCEA s34 and Schedule 8 LRA: removed monetary fines, split employees and contractors into separate tier tables, added explicit fair-hearing requirements, and clarified that recovery of quantifiable losses follows s34(2) BCEA and relies on consent held in the individual employment contract.
This policy is effective from the date of distribution. All queries should be directed to the Project Manager or your line manager.' where id='HR023';
update hr_policies set icon='👶', summary='6.1 Entitlement Male employees are entitled to 10 consecutive days of paternity leave upon the birth of a child, in accordance with the Labour Laws…', full_text='6. Paternity Leave
6.1 Entitlement
Male employees are entitled to 10 consecutive days of paternity leave upon the birth of a child, in accordance with the Labour Laws Amendment Act 2018.
6.2 Eligibility
Paternity leave applies to the biological father or adoptive parent of the newborn child. The employee must be the primary caregiver during the leave period.
6.3 Application and Timing
·         Paternity leave must be taken within 10 weeks of the child''s birth.
·         The employee must provide written notice and birth certificate as proof.
·         Leave is paid at ordinary rate of pay.
6.4 UIF Benefit
Paternity leave may be supported by UIF maternity benefits if the employee is registered with UIF and meets eligibility requirements.

Traditional "paternity leave" no longer exists as a standalone 10-day entitlement in South Africa. Following a landmark Constitutional Court ruling, South Africa has shifted to a unified, gender-neutral "parental leave" system. [1, 2]
Fathers and non-birthing parents are now legally entitled to share a total pool of 4 months and 10 days (roughly 130 calendar days) of parental leave with the birth mother. [1, 2]
Key Rules of the New Framework
Shared Allocation: If both parents are employed, they can split the 4 months and 10 days however they choose (consecutively or concurrently).
Disagreement Default: If parents cannot agree on a split, the leave automatically defaults to an equal split between them after the birth mother''s mandatory medical recovery period.
Single Parents: If you are a single parent or the sole employed parent, you are entitled to the full 4 consecutive months of leave on your own.
Birth Mother Protections: The birth mother must still legally take at least 6 weeks of recovery leave after giving birth. This time is deducted from the overall shared 130-day pool.
Adoption and Surrogacy: The exact same shared leave rights apply equally to biological, adoptive, and commissioning (surrogacy) parents. [1, 2, 3]
Pay and UIF Benefits
Employer Obligations: By law under the Basic Conditions of Employment Act (BCEA), parental leave is unpaid by your employer unless your specific employment contract or company policy states otherwise.
UIF Claims: If you have contributed to the Unemployment Insurance Fund (UIF) for at least 13 weeks, you can claim parental benefits. This pays on a sliding scale of 38% to 66% of your salary, capped at the maximum legislative threshold.
Legislative Delay: While the right to time off is immediate, Parliament has a 36-month window to fully upgrade the UIF systems. Currently, the birthing mother claims via standard channels, and partners splitting the leave must submit a signed Parental Leave Agreement and apply separately using Form UI-2.3. [1, 2, 3, 4, 5]
How to Apply to Your Employer
Written Notice: You must notify your employer in writing at least 4 weeks in advance of your intended leave and return dates.
Parental Declaration: Employers will likely require a parental leave declaration form detailing whether your partner is employed and how you intend to split the 130 days.
Required Documents: Prepare the child''s full birth certificate (listing both parents), a court adoption order, or a surrogacy agreement to verify your parental relationship. [1, 2]

Paternity leave for unmaried fathers
Unmarried biological fathers have the exact same rights to the shared 4-month and 10-day parental leave pool as married fathers under South African law. Marital status does not change your right to claim time off or apply for Unemployment Insurance Fund (UIF) benefits. [1, 2, 3]
However, to legally qualify for the leave and UIF, an unmarried father must satisfy specific legal criteria regarding parental status. [1, 2]
The Legal Hinge: "Parental Relationship" [1]
The Constitutional Court ruling dictates that to claim parental leave, you must be a party to a recognised parental relationship by assuming parental rights and responsibilities. According to Section 21 of the Children’s Act 38 of 2005, an unmarried biological father automatically acquires these rights if: [1, 2, 3, 4]
He was living with the birth mother in a permanent life partnership at the time of the child''s birth.
OR, regardless of cohabitation, he consents to being identified as the father, acknowledges paternity, and contributes (or tries in good faith to contribute) to the child''s upbringing and financial maintenance. [1, 2, 3]
Practical Proof Needed for HR and UIF [1]
Because you are not married, your employer''s HR department and the Department of Employment and Labour will require explicit paperwork to process your leave and UIF benefits: [1, 2]
The Full Birth Certificate: You must ensure your name is registered on the child’s full birth certificate at Home Affairs. This is the most vital document to prove your legal parental relationship.
Signed Parental Leave Agreement: If both you and the mother are employed, you must present a written, signed agreement showing exactly how you are splitting the 130 days.
Paternity Disputes: If the mother disputes your paternity, you cannot claim the leave until paternity is legally established, which may require a DNA test to secure your rights. [1, 2, 3, 4, 5]
If the Mother is Unemployed or You are a Single Dad
Sole Employed Parent: If the mother is unemployed, she is not part of the statutory pool split. As the sole employed parent, you are legally entitled to the full 4 consecutive months of parental leave to care for the child on your own.
Unmarried but Separated: Even if you and the mother are no longer together, you are still entitled to your share of the leave, provided you are co-parenting and have assumed legal responsibilities. If you cannot agree on a split, the law automatically divides the 130 days equally between you both' where id='HR024';
commit;
