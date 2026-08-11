function Card({ children, className = "", style = {} }) {
    return (
        <div
            className={`card p-4 ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}

export default Card;