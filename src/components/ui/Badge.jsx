function Badge({ status }) {

    const colors = {

        new:"secondary",

        interested:"success",

        call_later:"warning",

        not_interested:"danger",

        didnt_pick:"dark",

        not_reachable:"info",

        converted:"primary",

    };

    return(

        <span

            className={`badge bg-${colors[status] || "secondary"}`}

        >

            {status}

        </span>

    );

}

export default Badge;