// تفعيل اللغة العربية
moment.locale('ar');

// ============ مدير الدار التنفيذي ============
class DarExecutiveManager {
    constructor() {
        this.MEMBER_FEE = 30;
        this.STORAGE_KEYS = {
            MEMBERS: 'dar_members_executive_v2',
            EXPENSES: 'dar_expenses_executive_v2',
            TRANSACTIONS: 'dar_transactions_executive_v2'
        };

        this.members = this.loadData(this.STORAGE_KEYS.MEMBERS, this.getDefaultMembers());
        this.expenses = this.loadData(this.STORAGE_KEYS.EXPENSES, this.getDefaultExpenses());
        this.transactions = this.loadData(this.STORAGE_KEYS.TRANSACTIONS, []);

        this.init();
    }

    // البيانات الافتراضية الفاخرة
    getDefaultMembers() {
        return [
            { id: '1', name: 'أحمد الموسى', paid: true, lastPaymentDate: '2026-02-10T10:30:00' },
            { id: '2', name: 'سارة خالد', paid: false, lastPaymentDate: null },
            { id: '3', name: 'محمد عمر', paid: true, lastPaymentDate: '2026-02-09T14:20:00' },
            { id: '4', name: 'نور الهدى', paid: false, lastPaymentDate: null },
            { id: '5', name: 'ياسر القحطاني', paid: true, lastPaymentDate: '2026-02-08T09:15:00' },
            { id: '6', name: 'لمى سامي', paid: false, lastPaymentDate: null },
            { id: '7', name: 'عبدالله فهد', paid: true, lastPaymentDate: '2026-02-07T16:45:00' },
            { id: '8', name: 'هيا بدر', paid: false, lastPaymentDate: null },
            { id: '9', name: 'فهد العلي', paid: true, lastPaymentDate: '2026-02-06T11:00:00' },
            { id: '10', name: 'رنا إبراهيم', paid: false, lastPaymentDate: null }
        ];
    }

    getDefaultExpenses() {
        return [
            { id: 'e1', name: 'فاتورة الإنترنت', amount: 120, date: '2026-02-01T09:00:00' },
            { id: 'e2', name: 'الكهرباء', amount: 95, date: '2026-02-05T13:30:00' },
            { id: 'e3', name: 'المياه', amount: 45, date: '2026-02-10T11:20:00' },
            { id: 'e4', name: 'صيانة عامة', amount: 40, date: '2026-02-12T15:40:00' }
        ];
    }

    loadData(key, defaultValue) {
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    saveAll() {
        this.saveData(this.STORAGE_KEYS.MEMBERS, this.members);
        this.saveData(this.STORAGE_KEYS.EXPENSES, this.expenses);
        this.saveData(this.STORAGE_KEYS.TRANSACTIONS, this.transactions);
    }

    generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 12);
    }

    addTransaction(type, description, amount, relatedId = null) {
        const transaction = {
            id: this.generateId(),
            type: type,
            description: description,
            amount: amount,
            date: new Date().toISOString(),
            relatedId: relatedId
        };
        this.transactions.unshift(transaction);
        if (this.transactions.length > 50) {
            this.transactions = this.transactions.slice(0, 50);
        }
        this.saveData(this.STORAGE_KEYS.TRANSACTIONS, this.transactions);
    }

    togglePayment(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (member) {
            member.paid = !member.paid;
            
            if (member.paid) {
                member.lastPaymentDate = new Date().toISOString();
                this.addTransaction('payment', `دفع الاشتراك: ${member.name}`, this.MEMBER_FEE, memberId);
            } else {
                member.lastPaymentDate = null;
                this.addTransaction('payment', `إلغاء دفع: ${member.name}`, -this.MEMBER_FEE, memberId);
            }
            
            this.saveData(this.STORAGE_KEYS.MEMBERS, this.members);
            this.renderAll();
        }
    }

    addMember(name) {
        if (!name.trim()) return false;
        const newMember = {
            id: this.generateId(),
            name: name.trim(),
            paid: false,
            lastPaymentDate: null
        };
        this.members.push(newMember);
        this.addTransaction('member', `إضافة عضو جديد: ${name.trim()}`, 0, newMember.id);
        this.saveData(this.STORAGE_KEYS.MEMBERS, this.members);
        this.renderAll();
        return true;
    }

    deleteMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (member) {
            this.members = this.members.filter(m => m.id !== memberId);
            this.addTransaction('member', `حذف العضو: ${member.name}`, 0, memberId);
            this.saveData(this.STORAGE_KEYS.MEMBERS, this.members);
            this.renderAll();
        }
    }

    addExpense(name, amount) {
        if (!name.trim() || !amount || amount <= 0) return false;
        const newExpense = {
            id: this.generateId(),
            name: name.trim(),
            amount: Number(amount),
            date: new Date().toISOString()
        };
        this.expenses.push(newExpense);
        this.addTransaction('expense', `مصروف جديد: ${name.trim()}`, Number(amount), newExpense.id);
        this.saveData(this.STORAGE_KEYS.EXPENSES, this.expenses);
        this.renderAll();
        return true;
    }

    deleteExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (expense) {
            this.expenses = this.expenses.filter(e => e.id !== expenseId);
            this.addTransaction('expense', `حذف مصروف: ${expense.name}`, -expense.amount, expenseId);
            this.saveData(this.STORAGE_KEYS.EXPENSES, this.expenses);
            this.renderAll();
        }
    }

    resetMonth() {
        this.members.forEach(member => {
            member.paid = false;
            member.lastPaymentDate = null;
        });
        this.addTransaction('reset', 'بدء شهر جديد - إعادة تعيين حالات الدفع', 0);
        this.saveData(this.STORAGE_KEYS.MEMBERS, this.members);
        this.renderAll();
    }

    clearTransactions() {
        this.transactions = [];
        this.saveData(this.STORAGE_KEYS.TRANSACTIONS, this.transactions);
        this.renderTransactions();
    }

    getStats() {
        const totalMembers = this.members.length;
        const paidCount = this.members.filter(m => m.paid).length;
        const expectedAmount = totalMembers * this.MEMBER_FEE;
        const collectedAmount = paidCount * this.MEMBER_FEE;
        const totalExpenses = this.expenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingBalance = collectedAmount - totalExpenses;
        const unpaidCount = totalMembers - paidCount;
        const paymentRate = totalMembers > 0 ? (paidCount / totalMembers * 100).toFixed(1) : 0;

        return {
            totalMembers,
            paidCount,
            unpaidCount,
            expectedAmount,
            collectedAmount,
            totalExpenses,
            remainingBalance,
            paymentRate
        };
    }

    renderAll() {
        this.renderStats();
        this.renderMembersTable();
        this.renderExpensesTable();
        this.renderTransactions();
        this.checkExpenseAlert();
        this.updateDateTime();
    }

    renderStats() {
        const stats = this.getStats();
        const statsGrid = document.getElementById('statsGrid');
        
        const cards = [
            { title: 'إجمالي الأعضاء', value: stats.totalMembers, icon: 'fa-users-crown', suffix: '' },
            { title: 'المدفوع', value: stats.paidCount, icon: 'fa-check-double', suffix: `/${stats.totalMembers}` },
            { title: 'المتأخر', value: stats.unpaidCount, icon: 'fa-clock', suffix: '' },
            { title: 'المتحصل', value: stats.collectedAmount, icon: 'fa-sack-dollar', suffix: '₪' },
            { title: 'المصاريف', value: stats.totalExpenses, icon: 'fa-file-invoice', suffix: '₪' },
            { title: 'الرصيد', value: stats.remainingBalance, icon: 'fa-scale-balanced', suffix: '₪' }
        ];

        let html = '';
        cards.forEach((card, index) => {
            html += `
                <div class="stat-luxury">
                    <div class="stat-header">
                        <span class="stat-title">${card.title}</span>
                        <div class="stat-icon-luxury">
                            <i class="fas ${card.icon}"></i>
                        </div>
                    </div>
                    <div class="stat-value-luxury stat-${index}">${card.value}${card.suffix}</div>
                </div>
            `;
        });

        statsGrid.innerHTML = html;

        // إضافة تأثير التحديث
        for (let i = 0; i < 6; i++) {
            const el = document.querySelector(`.stat-${i}`);
            if (el) {
                el.classList.add('number-update');
                setTimeout(() => el.classList.remove('number-update'), 500);
            }
        }

        document.getElementById('memberStats').innerHTML = `${stats.paidCount} مدفوع / ${stats.unpaidCount} متأخر`;
        document.getElementById('expenseTotalBadge').innerHTML = `${stats.totalExpenses} ₪`;
    }

    renderMembersTable() {
        const tbody = document.getElementById('membersTableBody');
        
        if (this.members.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 48px; color: var(--gray-400);">
                <i class="fas fa-users-slash" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                لا يوجد أعضاء
            </td></tr>`;
            return;
        }

        let html = '';
        this.members.forEach(member => {
            const paidClass = member.paid ? 'paid' : '';
            const paidText = member.paid ? 'مدفوع' : 'غير مدفوع';
            const paidIcon = member.paid ? 'fa-check-circle' : 'fa-hourglass-half';
            const paymentDate = member.lastPaymentDate ? moment(member.lastPaymentDate).format('YYYY/MM/DD HH:mm') : '—';
            
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 44px; height: 44px; background: rgba(199, 162, 59, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <div>
                                <div style="font-weight: 700; color: white;">${member.name}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="status-chip ${paidClass}">
                            <i class="fas ${paidIcon}"></i>
                            ${paidText}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 13px; color: var(--gray-300);">${paymentDate}</span>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-toggle" data-id="${member.id}" style="background: rgba(199, 162, 59, 0.1); border: 1px solid rgba(199, 162, 59, 0.3); padding: 10px 16px; border-radius: 12px; color: var(--gold-400); cursor: pointer;">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                            <button class="delete-btn" data-id="${member.id}" style="background: transparent; border: none; color: var(--gray-500); padding: 10px; border-radius: 12px; cursor: pointer;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // إضافة event listeners
        tbody.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePayment(btn.dataset.id);
            });
        });

        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('هل أنت متأكد من حذف هذا العضو؟')) {
                    this.deleteMember(btn.dataset.id);
                }
            });
        });
    }

    renderExpensesTable() {
        const tbody = document.getElementById('expensesTableBody');
        
        if (this.expenses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 48px; color: var(--gray-400);">
                <i class="fas fa-receipt" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                لا توجد مصاريف
            </td></tr>`;
            return;
        }

        let html = '';
        this.expenses.forEach(expense => {
            const expenseDate = moment(expense.date).format('YYYY/MM/DD HH:mm');
            
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 44px; height: 44px; background: rgba(199, 162, 59, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
                                <i class="fas fa-file-invoice"></i>
                            </div>
                            <span style="color: white; font-weight: 600;">${expense.name}</span>
                        </div>
                    </td>
                    <td>
                        <span style="font-weight: 700; color: var(--gold-400);">${expense.amount} ₪</span>
                    </td>
                    <td>
                        <span style="font-size: 13px; color: var(--gray-300);">${expenseDate}</span>
                    </td>
                    <td>
                        <button class="expense-delete" data-id="${expense.id}" style="background: transparent; border: none; color: var(--gray-500); padding: 10px; border-radius: 12px; cursor: pointer;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        tbody.querySelectorAll('.expense-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                    this.deleteExpense(btn.dataset.id);
                }
            });
        });
    }

    renderTransactions() {
        const list = document.getElementById('transactionsList');
        
        if (this.transactions.length === 0) {
            list.innerHTML = `<div style="text-align: center; padding: 48px; color: var(--gray-400);">
                <i class="fas fa-history" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                لا توجد معاملات
            </div>`;
            return;
        }

        let html = '';
        this.transactions.slice(0, 20).forEach(trans => {
            const date = moment(trans.date).format('YYYY/MM/DD HH:mm');
            let icon = 'fa-circle';
            
            if (trans.type === 'payment') icon = 'fa-credit-card';
            else if (trans.type === 'expense') icon = 'fa-file-invoice-dollar';
            else if (trans.type === 'reset') icon = 'fa-calendar';
            else if (trans.type === 'member') icon = 'fa-user-plus';

            html += `
                <div class="transaction-item">
                    <div class="transaction-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: white; font-weight: 600;">${trans.description}</span>
                            ${trans.amount !== 0 ? `<span style="font-weight: 700; color: ${trans.amount > 0 ? 'var(--emerald-400)' : 'var(--ruby-400)'};">${trans.amount > 0 ? '+' : ''}${trans.amount} ₪</span>` : ''}
                        </div>
                        <div style="margin-top: 4px;">
                            <span style="font-size: 12px; color: var(--gray-400);"><i class="fas fa-clock"></i> ${date}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;
    }

    checkExpenseAlert() {
        const stats = this.getStats();
        const alertBox = document.getElementById('expenseAlert');
        if (stats.totalExpenses > stats.collectedAmount) {
            alertBox.style.display = 'block';
        } else {
            alertBox.style.display = 'none';
        }
    }

    updateDateTime() {
        const now = moment();
        document.getElementById('currentDate').textContent = now.format('dddd، D MMMM YYYY');
        document.getElementById('currentTime').textContent = now.format('HH:mm:ss');
    }

    init() {
        this.renderAll();
        
        // تحديث الوقت كل ثانية
        setInterval(() => this.updateDateTime(), 1000);

        // Event Listeners
        document.getElementById('addMemberBtn').addEventListener('click', () => {
            const input = document.getElementById('memberNameInput');
            if (this.addMember(input.value)) {
                input.value = '';
                input.focus();
            }
        });

        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            const nameInput = document.getElementById('expenseNameInput');
            const amountInput = document.getElementById('expenseAmountInput');
            if (this.addExpense(nameInput.value, amountInput.value)) {
                nameInput.value = '';
                amountInput.value = '';
                nameInput.focus();
            }
        });

        document.getElementById('newMonthBtn').addEventListener('click', () => {
            if (confirm('هل أنت متأكد من بدء شهر جديد؟ سيتم إعادة تعيين حالة الدفع لجميع الأعضاء.')) {
                this.resetMonth();
            }
        });

        document.getElementById('clearLogsBtn').addEventListener('click', () => {
            if (confirm('هل أنت متأكد من مسح سجل المعاملات؟')) {
                this.clearTransactions();
            }
        });

        // Enter key listeners
        document.getElementById('memberNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('addMemberBtn').click();
        });

        document.getElementById('expenseNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('addExpenseBtn').click();
        });

        document.getElementById('expenseAmountInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('addExpenseBtn').click();
        });
    }
}

// إطلاق التطبيق التنفيذي
document.addEventListener('DOMContentLoaded', () => {
    const app = new DarExecutiveManager();
});