import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchRevenue() {
  try {
    // Check if we have a valid database URL
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "postgres://...") {
      // Return mock revenue data when no database is configured
      console.log('Using mock revenue data...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockData = [
        { month: 'Jan', revenue: 2000 },
        { month: 'Feb', revenue: 1800 },
        { month: 'Mar', revenue: 2200 },
        { month: 'Apr', revenue: 2500 },
        { month: 'May', revenue: 2300 },
        { month: 'Jun', revenue: 3200 },
        { month: 'Jul', revenue: 3500 },
        { month: 'Aug', revenue: 3700 },
        { month: 'Sep', revenue: 2500 },
        { month: 'Oct', revenue: 2800 },
        { month: 'Nov', revenue: 3000 },
        { month: 'Dec', revenue: 4800 },
      ];
      
      console.log('Mock data fetch completed.');
      return mockData;
    }

    // Artificially delay a response for demo purposes.
    // Don't do this in production :)
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue[]>`SELECT * FROM revenue`;

    console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    // Return mock data on error
    const mockData = [
      { month: 'Jan', revenue: 2000 },
      { month: 'Feb', revenue: 1800 },
      { month: 'Mar', revenue: 2200 },
      { month: 'Apr', revenue: 2500 },
      { month: 'May', revenue: 2300 },
      { month: 'Jun', revenue: 3200 },
      { month: 'Jul', revenue: 3500 },
      { month: 'Aug', revenue: 3700 },
      { month: 'Sep', revenue: 2500 },
      { month: 'Oct', revenue: 2800 },
      { month: 'Nov', revenue: 3000 },
      { month: 'Dec', revenue: 4800 },
    ];
    return mockData;
  }
}

export async function fetchLatestInvoices() {
  try {
    // Check if we have a valid database URL
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "postgres://...") {
      // Return mock data when no database is configured
      return [
        {
          id: '1',
          amount: '$250.00',
          name: 'Delba de Oliveira',
          image_url: '/customers/delba-de-oliveira.png',
          email: 'delba@example.com',
        },
        {
          id: '2',
          amount: '$666.00',
          name: 'Lee Robinson',
          image_url: '/customers/lee-robinson.png',
          email: 'lee@example.com',
        },
        {
          id: '3',
          amount: '$500.00',
          name: 'Amy Burns',
          image_url: '/customers/amy-burns.png',
          email: 'amy@example.com',
        },
        {
          id: '4',
          amount: '$333.00',
          name: 'Balazs Orban',
          image_url: '/customers/balazs-orban.png',
          email: 'balazs@example.com',
        },
        {
          id: '5',
          amount: '$169.00',
          name: 'Michael Novotny',
          image_url: '/customers/michael-novotny.png',
          email: 'michael@example.com',
        },
      ];
    }

    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    // Return mock data on error
    return [
      {
        id: '1',
        amount: '$250.00',
        name: 'Delba de Oliveira',
        image_url: '/customers/delba-de-oliveira.png',
        email: 'delba@example.com',
      },
      {
        id: '2',
        amount: '$666.00',
        name: 'Lee Robinson',
        image_url: '/customers/lee-robinson.png',
        email: 'lee@example.com',
      },
      {
        id: '3',
        amount: '$500.00',
        name: 'Amy Burns',
        image_url: '/customers/amy-burns.png',
        email: 'amy@example.com',
      },
      {
        id: '4',
        amount: '$333.00',
        name: 'Balazs Orban',
        image_url: '/customers/balazs-orban.png',
        email: 'balazs@example.com',
      },
      {
        id: '5',
        amount: '$169.00',
        name: 'Michael Novotny',
        image_url: '/customers/michael-novotny.png',
        email: 'michael@example.com',
      },
    ];
  }
}

export async function fetchCardData() {
  try {
    // Check if we have a valid database URL
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "postgres://...") {
      // Return mock data when no database is configured
      return {
        numberOfCustomers: 12,
        numberOfInvoices: 6,
        totalPaidInvoices: '$2,000.00',
        totalPendingInvoices: '$500.00',
      };
    }

    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');
    const numberOfCustomers = Number(data[1][0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    // Return mock data on error
    return {
      numberOfCustomers: 12,
      numberOfInvoices: 6,
      totalPaidInvoices: '$2,000.00',
      totalPendingInvoices: '$500.00',
    };
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Check if we have a valid database URL
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "postgres://...") {
      // Return mock invoice data
      const mockInvoices = [
        {
          id: '1',
          amount: 25000,
          date: '2023-12-01',
          status: 'pending' as const,
          name: 'Delba de Oliveira',
          email: 'delba@example.com',
          image_url: '/customers/delba-de-oliveira.png',
        },
        {
          id: '2',
          amount: 66600,
          date: '2023-11-15',
          status: 'paid' as const,
          name: 'Lee Robinson',
          email: 'lee@example.com',
          image_url: '/customers/lee-robinson.png',
        },
        {
          id: '3',
          amount: 50000,
          date: '2023-11-10',
          status: 'pending' as const,
          name: 'Amy Burns',
          email: 'amy@example.com',
          image_url: '/customers/amy-burns.png',
        },
        {
          id: '4',
          amount: 33300,
          date: '2023-10-20',
          status: 'paid' as const,
          name: 'Balazs Orban',
          email: 'balazs@example.com',
          image_url: '/customers/balazs-orban.png',
        },
        {
          id: '5',
          amount: 16900,
          date: '2023-10-15',
          status: 'pending' as const,
          name: 'Michael Novotny',
          email: 'michael@example.com',
          image_url: '/customers/michael-novotny.png',
        },
      ];

      // Filter based on query if provided
      let filteredInvoices = mockInvoices;
      if (query) {
        filteredInvoices = mockInvoices.filter(invoice => 
          invoice.name.toLowerCase().includes(query.toLowerCase()) ||
          invoice.email.toLowerCase().includes(query.toLowerCase()) ||
          invoice.status.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Apply pagination
      return filteredInvoices.slice(offset, offset + ITEMS_PER_PAGE);
    }

    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    // Return mock data on error
    return [
      {
        id: '1',
        amount: 25000,
        date: '2023-12-01',
        status: 'pending' as const,
        name: 'Delba de Oliveira',
        email: 'delba@example.com',
        image_url: '/customers/delba-de-oliveira.png',
      },
    ];
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    // Check if we have a valid database URL
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "postgres://...") {
      // Return mock data - assume 1 page for demo
      return 1;
    }

    const data = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    // Return mock data on error
    return 1;
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    // Check if we have a valid database URL
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "postgres://...") {
      // Return mock invoice data
      return {
        id: id,
        customer_id: '1',
        amount: 500,
        status: 'pending' as const,
      };
    }

    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    // Return mock data on error
    return {
      id: id,
      customer_id: '1',
      amount: 500,
      status: 'pending' as const,
    };
  }
}

export async function fetchCustomers() {
  try {
    // Check if we have a valid database URL
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "postgres://...") {
      // Return mock customer data
      return [
        { id: '1', name: 'Delba de Oliveira' },
        { id: '2', name: 'Lee Robinson' },
        { id: '3', name: 'Amy Burns' },
        { id: '4', name: 'Balazs Orban' },
        { id: '5', name: 'Michael Novotny' },
      ];
    }

    const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    // Return mock data on error
    return [
      { id: '1', name: 'Delba de Oliveira' },
      { id: '2', name: 'Lee Robinson' },
      { id: '3', name: 'Amy Burns' },
      { id: '4', name: 'Balazs Orban' },
      { id: '5', name: 'Michael Novotny' },
    ];
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    // Check if we have a valid database URL
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "postgres://...") {
      // Return mock customer data
      const mockCustomers = [
        {
          id: '1',
          name: 'Delba de Oliveira',
          email: 'delba@example.com',
          image_url: '/customers/delba-de-oliveira.png',
          total_invoices: 3,
          total_pending: '$250.00',
          total_paid: '$500.00',
        },
        {
          id: '2',
          name: 'Lee Robinson',
          email: 'lee@example.com',
          image_url: '/customers/lee-robinson.png',
          total_invoices: 2,
          total_pending: '$666.00',
          total_paid: '$333.00',
        },
        {
          id: '3',
          name: 'Amy Burns',
          email: 'amy@example.com',
          image_url: '/customers/amy-burns.png',
          total_invoices: 1,
          total_pending: '$500.00',
          total_paid: '$0.00',
        },
      ];

      // Filter based on query if provided
      if (query) {
        return mockCustomers.filter(customer => 
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.email.toLowerCase().includes(query.toLowerCase())
        );
      }

      return mockCustomers;
    }

    const data = await sql<CustomersTableType[]>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    // Return mock data on error
    const mockCustomers = [
      {
        id: '1',
        name: 'Delba de Oliveira',
        email: 'delba@example.com',
        image_url: '/customers/delba-de-oliveira.png',
        total_invoices: 3,
        total_pending: '$250.00',
        total_paid: '$500.00',
      },
      {
        id: '2',
        name: 'Lee Robinson',
        email: 'lee@example.com',
        image_url: '/customers/lee-robinson.png',
        total_invoices: 2,
        total_pending: '$666.00',
        total_paid: '$333.00',
      },
    ];
    return mockCustomers;
  }
}
