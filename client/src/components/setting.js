import { Box } from "@mui/material";
import { useNavigate, useNavigation } from "react-router-dom";

function Setting() {
    let navigate = useNavigate();
    return (
        <Box>
            {/* 로그인 버튼 */}
            <Button
                onClick={() => {
                    let param = {
                        userId: idRef.current.value,
                        pwd: pwdRef.current.value
                    };

                    fetch("http://localhost:3010/user/login", {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify(param)
                    })
                        .then(res => res.json())
                        .then(data => {
                            console.log(data);
                            alert(data.msg);
                            if (data.result) {
                                localStorage.setItem("token", data.token);
                                navigate("/feed");
                            }
                        })
                }}
                variant="contained"
                fullWidth
                sx={{
                    marginTop: '16px',
                    padding: '10px 0',
                    backgroundColor: '#3897f0',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '1rem'
                }}
            >
                로그인
            </Button>
        </Box>
    );
}

export default Setting;