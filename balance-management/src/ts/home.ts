import type { BalanceDetail } from "./custom-types";
import Modal from "./modal";
import { getSession, supabase } from "./supabase-config";
import TableStorage from "./supabase-table";
import { Chart, registerables } from "chart.js";

const Home = () => {
    let currentUserId: string | null = null;
    let trendChart: Chart | null = null;
    let monthlyChart: Chart | null = null;
    const controller = new AbortController();
    Chart.register(...registerables);

    const balanceTable = TableStorage<BalanceDetail>('finance_list');
    const trendChartCanvas = document.getElementById('trend-chart') as HTMLCanvasElement;
    const monthlyChartCanvas = document.getElementById('monthly-chart') as HTMLCanvasElement;
    const startDateInput = document.getElementById('start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('end-date') as HTMLInputElement;
    
    const username = document.getElementById('username') as HTMLElement;
    const balanceInputField = document.getElementById("balance-input-field") as HTMLFormElement;
    const notification = document.getElementById("notification") as HTMLElement;
    const description = document.getElementById('description') as HTMLInputElement;
    const getBalance = document.getElementById("balance") as HTMLInputElement;
    const balanceNotification = Modal(notification);

    return {
        async initHomePage(): Promise<void> {
            balanceInputField.onsubmit = async (event) => await this.submitData(event);

            const session = await getSession();
            if (session && session.user) {
                currentUserId = session.user.id;
                if (currentUserId) await this.showUserName(currentUserId);
            } else {
                balanceNotification.createModal('Please sign in to see your balance');
                balanceNotification.showModal();
                return;
            }

            document.addEventListener("click", async (event) => {
                const target = event.target as HTMLElement;
                if (target.closest('#close-insert-form')) this.hideInsertForm();
                else if (target.closest('#open-insert-form')) this.openInsertForm();
                else if (target.closest('#filter-button')) this.loadCharts();
            }, { signal: controller.signal });
        },

        async loadCharts(): Promise<void> {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            
            const records = await this.fetchFinanceData(startDate, endDate);
            const { dailyData, monthlyData } = this.processData(records);
            
            this.renderTrendChart(dailyData);
            this.renderMonthlyChart(monthlyData);
        },

        async fetchFinanceData(startDate?: string, endDate?: string): Promise<BalanceDetail[]> {
            let query = supabase
            .from('finance_list')
            .select('id, created_at, amount, type, description, user_id')
            .order('created_at', { ascending: true });

            if (startDate && endDate) {
                query = query.gte('created_at', startDate).lte('created_at', endDate);
            }

            const { data, error } = await query;

            if (error) throw 'Failed to get and show your data';

            return data as BalanceDetail[];
        },

        processData(records: BalanceDetail[]) {
            // Data untuk grafik garis (trend)
            const dailyData: { [date: string]: { income: number; expense: number } } = {};

            // Data untuk grafik batang (bulanan)
            const monthlyData: { [month: string]: { income: number; expense: number } } = {};

            records.forEach(record => {
                const date = new Date(record.created_at);
                const dateKey = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

                // Inisialisasi jika belum ada
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = { income: 0, expense: 0 };
                }

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expense: 0 };
                }

                // Tambahkan amount berdasarkan tipe
                if (record.type === 'income') {
                    dailyData[dateKey].income += record.amount;
                    monthlyData[monthKey].income += record.amount;
                } else {
                    dailyData[dateKey].expense += record.amount;
                    monthlyData[monthKey].expense += record.amount;
                }
            });

            return { dailyData, monthlyData };
        },

        renderTrendChart(dailyData: { [date: string]: { income: number; expense: number } }) {
            const dates = Object.keys(dailyData).sort();
            const incomeData = dates.map(date => dailyData[date].income);
            const expenseData = dates.map(date => dailyData[date].expense);

            // Hapus chart lama jika ada
            if (trendChart) trendChart.destroy();

            trendChart = new Chart(trendChartCanvas, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Income',
                            data: incomeData,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Expense',
                            data: expenseData,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Daily Income vs Daily Expense Trend'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => `Rp${Number(value).toLocaleString('id-ID')}`
                            }
                        }
                    }
                }
            });
        },

        renderMonthlyChart(monthlyData: { [month: string]: { income: number; expense: number } }) {
            const months = Object.keys(monthlyData).sort();
            const incomeData = months.map(month => monthlyData[month].income);
            const expenseData = months.map(month => monthlyData[month].expense);

            // Hapus chart lama jika ada
            if (monthlyChart) monthlyChart.destroy();

            monthlyChart = new Chart(monthlyChartCanvas, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Income',
                            data: incomeData,
                            backgroundColor: 'rgba(75, 192, 192, 0.7)'
                        },
                        {
                            label: 'Expense',
                            data: expenseData,
                            backgroundColor: 'rgba(255, 99, 132, 0.7)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monthly Income vs Monthly Expense Comparison'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => `Rp${Number(value).toLocaleString('id-ID')}`
                            }
                        }
                    }
                }
            });
        },

        async showUserName(id: string) {
            try {               
                const { data, error } = await supabase
                .from('finance_list_user')
                .select('username')
                .eq('id', id)
                .single();

                if (error) throw 'Failed to get and show your username';

                if (data && data.username) {
                    username.innerHTML = '';
                    username.textContent = `Hello, ${data.username}`;
                } else {
                    username.innerHTML = '';
                    username.textContent = 'Hello, User';
                }
            } catch (error: any) {
                username.innerHTML = '';
                username.textContent = 'Hello, User';
                balanceNotification.createModal(`Error: ${error.message || error}`);
                balanceNotification.showModal();
            }
        },

        async submitData(event: SubmitEvent): Promise<void> {
            event.preventDefault();
            const trimmedAmount = Number(getBalance.value.trim());
            const trimmedDescription = description.value.trim();
            const selectedType = (document.querySelector('input[name="category"]:checked') as HTMLInputElement);

            if (isNaN(trimmedAmount) || !selectedType) {
                balanceNotification.createModal('Missing required data!');
                balanceNotification.showModal();
                return;
            }

            if (!currentUserId) return;

            try {
                await balanceTable.insertData({
                    amount: Number(getBalance.value.trim()),
                    type: selectedType.value,
                    description: trimmedDescription || '-',
                    user_id: currentUserId
                });
            } catch (error: any) {
                balanceNotification.createModal(`Error: ${error.message}`);
                balanceNotification.showModal();
            } finally {
                balanceInputField.reset();
                this.hideInsertForm();
            }
        },

        openInsertForm() {
            balanceInputField.classList.remove('hidden');
            balanceInputField.classList.add('flex');
        },

        hideInsertForm() {
            balanceInputField.classList.add('hidden');
            balanceInputField.classList.remove('flex');
            balanceInputField.reset();
        },

        teardownHomePage() {
            balanceInputField.reset();
            balanceNotification.teardownModal();
            controller.abort();
            this.hideInsertForm();
        }
    }
}

const home = Home();
const init = () => home.initHomePage();
const teardown = () => home.teardownHomePage();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);