import { NextRequest, NextResponse } from "next/server";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";

export async function POST() {
  try {
    const ownerId = "owner-hernan-rd";

    // 1. Create Serrucho "Viaje Punta Cana"
    const serrucho = await SerruchoService.create(ownerId, {
      name: "Viaje Punta Cana 🌴",
      description: "Gastos compartidos del viaje a la villa y playa en Punta Cana",
      currency: "DOP",
      creator_name: "Hernan",
      creator_email: "hernan@ejemplo.do",
      initial_participants: ["Braulin"],
      event_date: new Date().toISOString().split("T")[0],
    });

    const participants = await ParticipantService.listBySerrucho(serrucho.id);
    const hernan = participants.find((p) => p.name.includes("Hernan")) || participants[0];
    const braulin = participants.find((p) => p.name.includes("Braulin")) || participants[1];

    if (!hernan || !braulin) {
      throw new Error("No se pudieron inicializar los participantes Hernan y Braulin");
    }

    // 2. Create Expense RD$ 500 divided 25% (Hernan) / 75% (Braulin)
    const expense = await ExpenseService.add(serrucho.id, {
      description: "Picadera y Bebidas en Punta Cana",
      amount: 500,
      paid_by_participant_id: hernan.id,
      category: "FOOD_GROCERIES",
      split_method: "PERCENTAGE",
      expense_date: new Date().toISOString().split("T")[0],
      splits: [
        {
          participant_id: hernan.id,
          percentage: 25,
        },
        {
          participant_id: braulin.id,
          percentage: 75,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Seed 'Viaje Punta Cana' creado con éxito.",
      serrucho: {
        id: serrucho.id,
        name: serrucho.name,
        currency: serrucho.currency,
      },
      participants: [
        { id: hernan.id, name: hernan.name, role: "Owner" },
        { id: braulin.id, name: braulin.name, role: "Participant" },
      ],
      expense: {
        id: expense.id,
        description: expense.description,
        total_amount: "RD$ 500.00",
        splits: [
          { participant: "Hernan", percentage: "25%", amount: "RD$ 125.00" },
          { participant: "Braulin", percentage: "75%", amount: "RD$ 375.00" },
        ],
      },
      net_settlement: "Braulin le debe RD$ 375.00 a Hernan",
      redirect_url: `/dashboard/${serrucho.id}`,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Support triggering seed with GET for easy browser testing
  return POST(req);
}
