import Card from "../ui/Card";

function StatCard({
    title,
    value,
    icon,
    color = "#2563eb",
    subtitle
}) {
    return (
        <Card className="stat-card h-100">
            <div className="d-flex align-items-center justify-content-between">
                <div>
                    <span className="text-muted fw-medium" style={{ fontSize: "0.85rem" }}>
                        {title}
                    </span>
                    <h2
                        className="my-2 fw-bold"
                        style={{
                            color: "#0f172a",
                            fontSize: "1.85rem",
                            letterSpacing: "-0.03em"
                        }}
                    >
                        {value}
                    </h2>
                    {subtitle && (
                        <span
                            className="badge"
                            style={{
                                backgroundColor: `${color}15`,
                                color: color,
                                fontWeight: 600,
                                fontSize: "0.75rem"
                            }}
                        >
                            {subtitle}
                        </span>
                    )}
                </div>

                <div
                    className="stat-card-icon"
                    style={{
                        backgroundColor: `${color}12`,
                        color: color
                    }}
                >
                    {icon}
                </div>
            </div>
        </Card>
    );
}

export default StatCard;